import { AuthModalState } from '@/atoms/authModalAtom';
import { communityState } from '@/atoms/communitiesAtom';
import { Post, PostVote, postState } from '@/atoms/postsAtom';
import { auth, firestore, storage } from '@/firebase/clientApp';
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';



const usePosts = () => {
    const [user] = useAuthState(auth);
    const [postStateValue, setPostStateValue] = useRecoilState(postState);
    const currentCommunity = useRecoilValue(communityState).currentCommunity;
    const setAuthModalState = useSetRecoilState(AuthModalState);
    const router = useRouter();


    const onVote = async (
        event: React.MouseEvent<SVGElement, MouseEvent>,  
        post: Post, 
        vote: number, 
        communityId: string
        ) => {
            event.stopPropagation();
        // check for a user if not open modal
        if (!user?.uid) {
            setAuthModalState({ open: true, view: "login"});
            return;
        }


        try {

            const {voteStatus} = post;
            const existingVote = postStateValue.postVotes.find(
                (vote) => vote.postId === post.id
                );

            const batch = writeBatch(firestore);
            const updatedPost = {...post};
            const updatedPosts = [...postStateValue.posts];
            let updatedPostVotes = [...postStateValue.postVotes];
            let voteChange = vote;


            // new vote
            if (!existingVote) {
                // create a new postvote document
                const postVoteRef = doc(collection(firestore, 'users', `${user?.uid}/postVotes` )
                );

                const newVote: PostVote = {
                    id: postVoteRef.id,
                    postId: post.id!,
                    communityId,
                    voteValue: vote, // 1 or -1
                };

                batch.set(postVoteRef, newVote);

                // add or subtract 1 to post.voteStatus
                updatedPost.voteStatus = voteStatus + vote;
                updatedPostVotes = [...updatedPostVotes, newVote];
                
            }
            // exsisting vote - they have voted before
            else {

                const postVoteRef = doc(firestore, 'users', `${user?.uid}/postVotes/${existingVote.id}`)                
                // removing their vote (up to neutral or down to neutral)
                if (existingVote.voteValue === vote) {
                    // add or subtract 1 from post.voteStatus
                    updatedPost.voteStatus = voteStatus - vote; 
                    updatedPostVotes = updatedPostVotes.filter(vote => vote.id !== existingVote.id)

                    // delete the post vote dpcument
                    batch.delete(postVoteRef);

                    voteChange *= -1;

                }
                // flipping their vote up to down or down to up 
                else {

                    // add or subtract 2 from post.vote status
                    updatedPost.voteStatus = voteStatus + 2 * vote;

                    const voteIdx = postStateValue.postVotes.findIndex(
                        (vote => vote.id === existingVote.id)
                    );

                    updatedPostVotes[voteIdx] = {
                        ...existingVote,
                        voteValue: vote,
                    }

                    //updating the exsisting postVote document
                    batch.update(postVoteRef, {
                        voteValue: vote,
                    });

                    voteChange = 2 * vote;
                }
            }

            // update state with updated value
            const postIdx = postStateValue.posts.findIndex(
                (item) => item.id === post.id
            );
            updatedPosts[postIdx] = updatedPost;
            setPostStateValue(prev => ({
                ...prev,
                posts: updatedPosts,
                postVotes: updatedPostVotes,
            }));

            if (postStateValue.selectedPost) {
                setPostStateValue(prev => ({
                    ...prev,
                    selectedPost: updatedPost,
                }))
            }

                // update post doc
                const postRef = doc(firestore, 'posts', post.id!);
                batch.update(postRef, { voteStatus: voteStatus + voteChange })
                    
                await batch.commit();
        } catch (error) {
            console.log('onVote error', error)
        }
    };

    const onSelectPost  = (post: Post) => {
        setPostStateValue(prev => ({
            ...prev, 
            selectedPost: post,
        }));
        router.push(`/r/${post.communityId}/comments/${post.id}`)
    };

    const onDeletePost = async (post: Post): Promise<boolean> => {

        try {
            // check if image, if there is delete from storage
            if (post.imageURL) {
                const imageRef = ref(storage, `posts/${post.id}/image`);
                
                console.log(post.id)
                await deleteObject(imageRef);
                console.log('there is a image to delete')

            }
            // delete post document form firestore
            const postDocRef = doc(firestore, 'posts', post.id!);
            await deleteDoc(postDocRef);


            // update recoil state
            setPostStateValue(prev => ({
                ...prev,
                posts: prev.posts.filter((item) => item.id !== post.id),
            }));
            return true;
        } catch (error) {
            return false;
        }
    };

    const getCommunityPostVotes = async (communityId: string ) => {
        const postVotesQuery = query(
            collection(firestore, 'users', `${user?.uid}/postVotes`), 
            where('communityId', '==', communityId) 
            );

        const postVoteDocs = await getDocs(postVotesQuery);
        const postVotes = postVoteDocs.docs.map(doc => ({
             id: doc.id,
             ...doc.data(),
            }));
            setPostStateValue(prev => ({
                ...prev,
                postVotes: postVotes as PostVote[],
            }));
    };

    useEffect(() => {
        if (!user || !currentCommunity?.id) return;
        getCommunityPostVotes(currentCommunity?.id);
    }, [user, currentCommunity]);


    // if there is no user clear post votes
    useEffect(() => {
        if (!user) {
            setPostStateValue((prev) => ({
                ...prev,
                postVotes: [],
            }))
        }
    }, [user])
    
    return {
        postStateValue,
        setPostStateValue,
        onVote,
        onSelectPost,
        onDeletePost
    }
}
export default usePosts;