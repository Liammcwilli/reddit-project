import React, { MutableRefObject, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, Icon, Text } from '@chakra-ui/react';
import { BiPoll } from "react-icons/bi";
import { BsLink45Deg, BsMic } from "react-icons/bs";
import { IoDocumentText, IoImageOutline } from "react-icons/io5";
import { AiFillCloseCircle } from "react-icons/ai";
import TabItem from './TabItem';
import TextInputs from './PostForm/TextInputs';
import ImageUpload from './PostForm/ImageUpload';
import { Post } from '@/atoms/postsAtom';
import { useRouter } from "next/router";
import { User } from 'firebase/auth';
import { Timestamp, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore, storage } from '@/firebase/clientApp';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import useSelectFile from '@/hooks/useSelectFile';

type NewPostFormProps = {
    user: User;
    communityImageURL?: string;
};

const formTabs = [
    {
        title: 'Post',
        icon: IoDocumentText,

    },
    {
        title: 'Images & Video',
        icon: IoImageOutline,

    },
    {
        title: 'Link',
        icon: BsLink45Deg,

    },
    {
        title: 'Poll',
        icon: BiPoll,

    },
    {
        title: 'Talk',
        icon: BsMic,
    }
]

export type TabItemType = {
    title: string,
    icon: typeof Icon.arguments;
}



const NewPostForm:React.FC<NewPostFormProps> = ({ user, communityImageURL }) => {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState(formTabs[0].title);
    const [textInputs, setTextInputs] = useState({
        title: '',
        body: '',
    });

   
    const { selectedFile, setSelectedFile, onSelectFile} = useSelectFile();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleCreatePost = async () => {

        const { communityId } = router.query
        // create new post object of type post
        const newPost: Post = {
            communityId: communityId as string,
            communityImageURL: communityImageURL || '',
            creatorId: user?.uid,
            creatorDisplayName: user.email!.split('@')[0],
            title: textInputs.title,
            body: textInputs.body,
            numberOfComments: 0,
            voteStatus: 0,
            createdAt: serverTimestamp() as Timestamp,
    
        }

        setLoading(true);
        try {
            // store post in database
            const postDocRef = await addDoc(collection(firestore, 'posts'), newPost);
            //check for slected file
            if (selectedFile) {
                // store media file in storage using getDOwnloadURL (return imageURL)
                const imageRef = ref(storage, `posts/${postDocRef.id}/image`);
                await uploadString(imageRef, selectedFile, `data_url`);
                const downloadURL = await getDownloadURL(imageRef);

                //update post doc by adding imageURL
                await updateDoc(postDocRef, {
                    imageURL: downloadURL,
                })

           }


                //redirect user back to community page using the router
                router.back();
        } catch (error: any) {
            console.log('handleCreatePost error', error.message)
            setError(true);
        }
        setLoading(false);


    };


    const onTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { target: {name, value },
    } = event;
     setTextInputs(prev => ({
        ...prev,
        [name]: value,
     }))
    };
    
    return (
        <Flex direction='column' bg='white' borderRadius={4} mt={2}>
            <Flex width='100%'>
                {formTabs.map(item => (
                    <TabItem 
                    item={item} 
                    key={item.title}
                    selected={item.title === selectedTab} 
                    setSelectedTab={setSelectedTab}
                    />
                ))}
            </Flex>
            <Flex p={4}>
               {selectedTab === 'Post' && 
                (<TextInputs 
                textInputs={textInputs}
                handleCreatePost={handleCreatePost}
                onChange={onTextChange}
                loading={loading}
                 />)}
                 {selectedTab === 'Images & Video' && 
                 <ImageUpload 
                 selectedFile={selectedFile} 
                 onSelectImage={onSelectFile}
                 setSelectedTab={setSelectedTab}
                 setSelectedFile={setSelectedFile}
                 />}
            </Flex>
            {error && (
                <Alert status='error'>
                <AlertIcon />
                <Text mr={2}>Error creating post</Text>
              </Alert>
            )}
        </Flex>
    )
}
export default NewPostForm;