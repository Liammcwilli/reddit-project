import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/clientApp";
import Navbar from "../Navbar/Navbar";

type Props = {
  children: React.ReactNode
}


const Layout:React.FC<Props> = ({ children }) => {
  // useAuth(); // will implement later at end of tutorial

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default Layout;