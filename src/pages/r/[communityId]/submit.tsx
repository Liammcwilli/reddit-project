import PageContent from '@/components/Layout/PageContent';
import React from 'react';
import { Text, Box } from '@chakra-ui/react';
import NewPostForm from '@/components/Posts/NewPostForm';
import { auth } from '@/firebase/clientApp';
import { useAuthState } from 'react-firebase-hooks/auth';



const submitPostPage:React.FC = () => {
    const [user] = useAuthState(auth);
    
    return (
        <PageContent>
            <>
                <Box p='14px 0px' borderBottom='1px solid' borderColor='white'>
                    <Text>Create a Post</Text>
                </Box>
                {user && <NewPostForm user={user} />}
            </>

            <> </>

        </PageContent>
    )
}
export default submitPostPage;