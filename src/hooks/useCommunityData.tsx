import { Community, CommunitySnippet, communityState } from '@/atoms/communitiesAtom';
import { auth, firestore } from '@/firebase/clientApp';
import React, { useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getDocs, collection, writeBatch, doc, increment, getDoc } from 'firebase/firestore';
import { AuthModalState } from '@/atoms/authModalAtom';
import { PostVote } from '@/atoms/postsAtom';
import { useRouter } from 'next/router';



const useCommunityData = () => {
    const [user] = useAuthState(auth);
const [communityStateValue, setCommunityStateValue] =
 useRecoilState(communityState);
 const setAuthModalState = useSetRecoilState(AuthModalState);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const router = useRouter();

    const onJoinOrLeaveCommunity = (communityData: Community, isJoined: boolean) => {
        // is user signed in?
        // if not open auth modal and have them sign in
        if(!user) {
            setAuthModalState({ open: true, view: 'login'})
            return;
        }

        if (isJoined) {
            leaveCommunity(communityData.id);
            return;
        }
        joinCommunity(communityData);
    }

    const getMySnippets = async () => {
            setLoading(true);
        try {
            // get user snippets
            const snippetDocs = await getDocs(
                collection(firestore, `users/${user?.uid}/communitySnippets`)
                );
            const snippets = snippetDocs.docs.map(doc => ({...doc.data() }));
            setCommunityStateValue(prev => ({
                ...prev,
                mySnippets: snippets as CommunitySnippet[],
                snippetsFetched: true,
            }))



            console.log('here are the snippets', snippets)
            
        } catch (error: any) {
            console.log('getMySnippets error', error);
            setError(error.message);
        }
        setLoading(false);
    }
    

    const joinCommunity = async (community: Community) => {
        console.log("JOINING COMMUNITY: ", community.id);
        try {
          const batch = writeBatch(firestore);
    
          const newSnippet: CommunitySnippet = {
            communityId: community.id,
            imageURL: community.imageURL || "",
          };
          batch.set(
            doc(
              firestore,
              `users/${user?.uid}/communitySnippets`,
              community.id // will for sure have this value at this point
            ),
            newSnippet
          );
    
          batch.update(doc(firestore, "communities", community.id), {
            numberOfMembers: increment(1),
          });
    
          // perform batch writes
          await batch.commit();
    
          // Add current community to snippet
          setCommunityStateValue((prev) => ({
            ...prev,
            mySnippets: [...prev.mySnippets, newSnippet],
          }));
        } catch (error) {
          console.log("joinCommunity error", error);
        }
        setLoading(false);
      };

      const leaveCommunity = async (communityId: string) => {
        try {
          const batch = writeBatch(firestore);
    
          batch.delete(
            doc(firestore, `users/${user?.uid}/communitySnippets/${communityId}`)
          );
    
          batch.update(doc(firestore, "communities", communityId), {
            numberOfMembers: increment(-1),
          });
    
          await batch.commit();
    
          setCommunityStateValue((prev) => ({
            ...prev,
            mySnippets: prev.mySnippets.filter(
              (item) => item.communityId !== communityId
            ),
          }));
        } catch (error) {
          console.log("leaveCommunity error", error);
        }
        setLoading(false);
      };

      const getCommunityData = async (communityId: string )=> {
        try {
          const communityDocRef = doc(firestore, 'communities', communityId);
          const communityDoc = await getDoc(communityDocRef);

          setCommunityStateValue(prev => ({
              ...prev,
              currentCommunity: {
                 id: communityDoc.id, 
                 ...communityDoc.data(), } as Community,
          }))
          
        } catch (error) {
          console.log('getCommunityData error', error)
          
        }
      }

    useEffect(() => {
        if (!user) {
          setCommunityStateValue(prev => ({
            ...prev,
            mySnippets: [],
            snippetsFetched: false
          }))
          return;
        };
        getMySnippets();
    }, [user]);

    useEffect(() => {
      const { communityId } = router.query;


    if (communityId && !communityStateValue.currentCommunity) {
      getCommunityData(communityId as string);
    }
    }, [router.query, communityStateValue.currentCommunity])
    
    return {
        communityStateValue,
        onJoinOrLeaveCommunity,
        loading,
    }
}
export default useCommunityData;