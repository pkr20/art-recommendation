import React from 'react'
import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
// Adjust the import path below if you move firebase.js to the frontend
import { auth } from "../../backend/api/firebase";
export default function SignIn (){
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [error, setError] = useState("")
    const [user, setUser] = useState("") //does this have to be set to null?
    

    //handle sign in function 
    const handleSignIn = async (e) => {
        e.preventDefault(); 
        setError("")
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
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