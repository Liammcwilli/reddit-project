import { AuthModalState } from '@/atoms/authModalAtom';
import { auth } from '@/firebase/clientApp';
import { Button, Flex, Input, Text } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { FIREBASE_ERRORS } from '../../../firebase/errors';

const SignUp:React.FC = () => {
    
    const setAuthModalState = useSetRecoilState(AuthModalState);
    const [signUpForm, setSignUpForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState('');
    const [
        createUserWithEmailAndPassword,
        user,
        loading,
        userError,
      ] = useCreateUserWithEmailAndPassword(auth);

    // firebase logic
    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (error) setError('')
        if (signUpForm.password !== signUpForm.confirmPassword ) {
        // setError
    setError('Passwords do not match');
        return;
    }
        // passwords match
        createUserWithEmailAndPassword(signUpForm.email, signUpForm.password)
    };

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // update form state
        setSignUpForm(prev => ({
            ...prev,
            [event.target.name]: event.target.value,
        }));
    };

    return ( <form onSubmit={onSubmit}>
            <Input 
                required
                name="email" 
                placeholder='Email' 
                type="email" 
                mb={2} 
                onChange={onChange} 
                fontSize="10pt"
                _placeholder={{ color: "gray.500"}}
                _hover={{
                    bg: "white",
                    border: "1px solid",
                    borderColor: "blue.500",
                }}
                _focus={{
                    outline: "none",
                    bg: "white",
                    border: "1px solid",
                    borderColor: "blue.500",
                }}
                bg="gray.50"
            />
             <Input
                required
                name="password" 
                placeholder='Password' 
                type="password" 
                mb={2} 
                onChange={onChange}
                fontSize="10pt"
                _placeholder={{ color: "gray.500"}}
                _hover={{
                    bg: "white",
                    border: "1px solid",
                    borderColor: "blue.500",
                }}
                _focus={{
                    outline: "none",
                    bg: "white",
                    border: "1px solid",
                    borderColor: "blue.500",
                }}
                bg="gray.50"
            />
            <Input
                required
                name="confirmPassword" 
                placeholder='Confirm Password' 
                type="password" 
                mb={2} 
                onChange={onChange}
                fontSize="10pt"
                _placeholder={{ color: "gray.500"}}
                _hover={{
                    bg: "white",
                    border: "1px solid",
                    borderColor: "blue.500",
                }}
                _focus={{
                    outline: "none",
                    bg: "white",
                    border: "1px solid",
                    borderColor: "blue.500",
                }}
                bg="gray.50"
            />
            <Text textAlign="center" color="red" fontSize="10pt">
                {error || 
                FIREBASE_ERRORS[userError?.message as keyof typeof FIREBASE_ERRORS]}
            </Text>
            
            <Button 
                isLoading={loading}
                type="submit"
                width="100%"
                height="36px"
                mt={2}
                mb={2}
            >
                Sign Up</Button>
            <Flex fontSize="9pt" justifyContent="center">
                <Text mr={1}>Already a redditor</Text>
                <Text 
                color="blue.500" 
                fontWeight={700} 
                cursor="pointer" 
                onClick={() =>
                    setAuthModalState((prev) => ({
                        ...prev,
                        view: "login",
                    }))
                }
                >Log in</Text>
            </Flex>
        </form>
    )
}
export default SignUp;