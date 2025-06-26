import React from 'react'
import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../backend/api/firebase";
import {useNavigate} from "react-router-dom"

export default function SignIn (){
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [error, setError] = useState("")
    const [user, setUser] = useState("") 
    const navigate = useNavigate(); 
    

    //handle sign in function 
    const handleSignIn = async (e) => {
        e.preventDefault(); 
        setError("")
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            navigate("/main") // navigates to main page
        } catch (error) {
            setError("Could not find account, re-enter password or please register.");
            
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault(); 
        setError("")
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            console.log('Registration successful!')
            navigate("/main") 
        } catch (error) {
            setError("Registration not working." + error.message)
        }
        
    }

    return (
        <div>
            <form onSubmit={handleSignIn} >
                <input type="email" placeholder='Email' value={email} onChange={e => setEmail(e.target.value)} required/>
                <input type= "password" placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} required></input>
                <button type="submit">Sign In</button>
                <button type="button" onClick={handleRegister}>Register</button>
            </form>
            {error && <div style={{color: "red"}}> {error} </div>}
            {user && <div>Welcome, {user.email}!</div>}
        </div>
    )



}