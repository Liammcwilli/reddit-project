import PageContent from '@/components/Layout/PageContent';
import React from 'react';
import { Text, Box } from '@chakra-ui/react';
import NewPostForm from '@/components/Posts/NewPostForm';
import { auth } from '@/firebase/clientApp';
import { useAuthState } from 'react-firebase-hooks/auth';
import useCommunityData from '@/hooks/useCommunityData';
import About from '@/components/Community/About';



const SubmitPostPage: React.FC = () => {
    const [user] = useAuthState(auth);
    const { communityStateValue } = useCommunityData();
    console.log('COMMUNITY', communityStateValue);
    
    return (
        <PageContent>
            <>
                <Box p='14px 0px' borderBottom='1px solid' borderColor='white'>
                    <Text>Create a Post</Text>
                </Box>
                {user && <NewPostForm user={user} communityImageURL={communityStateValue.currentCommunity?.imageURL}/>}
            </>
                {communityStateValue.currentCommunity && <About communityData={communityStateValue.currentCommunity} />}
            <> </>

        </PageContent>
    )
}
export default SubmitPostPage;