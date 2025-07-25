import React from 'react'
import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../backend/api/firebase";
import {useNavigate} from "react-router-dom"
import { loginToBackend } from '../utils/sessionApi';

export default function SignIn({ isOpen, onClose, setUser }){
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [error, setError] = useState("")
    const [localUser, setLocalUser] = useState("") 
    const [isSuccess, setIsSuccess] = useState(false)
    const navigate = useNavigate(); 
    
    //close modal and reset form
    const handleClose = () => {
        setEmail("");
        setPassword("");
        setError("");
        setLocalUser("");
        setIsSuccess(false);
        onClose();
    };

    //handle sign in function of working account
    const handleSignIn = async (e) => {
        e.preventDefault(); 
        setError("")
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            //call backend to set session cookie
            try {
                await loginToBackend(userCredential.user.uid);
            } catch (err) {
                setError("Backend login failed. Please try again.");
                return;
            }
            
            setLocalUser(userCredential.user);
            
            //update global user state if setUser is available
            if (setUser) {
                setUser({ userId: userCredential.user.uid });
            }
            
            setIsSuccess(true);
            //show success message before closing
            setTimeout(() => {
                handleClose();
                navigate("/main");
            }, 2000);
        } catch (error) {
            setError("Could not find account, re-enter password or please register.");
        }
    }

    //handle registration of a new account using firebase
    const handleRegister = async (e) => {
        e.preventDefault(); 
        setError("")
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            //call backend to set session cookie
            try {
                await loginToBackend(userCredential.user.uid);
            } catch (err) {
                setError("Backend login failed. Please try again.");
                return;
            }
            
            setLocalUser(userCredential.user);
            if (setUser) {
                setUser({ userId: userCredential.user.uid });
            }
            
            setIsSuccess(true);
            //shows success message before closing
            setTimeout(() => {
                handleClose();
                navigate("/main");
            }, 2000);
        } catch (error) {
            setError("Registration not working." + error.message)
        }
    }


    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose}>×</button>
                <div className="signin-container">
                    <h2>Sign In / Register</h2>
                    
                    {isSuccess ? (
                        <div className="signin-success-container">
                            <div className="success-icon">✓</div>
                            <h3>Success!</h3>
                            <p>Welcome, {localUser.email}!</p>
                            <p>Redirecting to main page...</p>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSignIn} className="signin-form">
                                <input 
                                    type="email" 
                                    placeholder='Email' 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    required
                                    className="signin-input"
                                />
                                <input 
                                    type="password" 
                                    placeholder='Password' 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required
                                    className="signin-input"
                                />
                                <div className="signin-buttons">
                                    <button type="submit" className="signin-btn">Sign In</button>
                                    <button type="button" onClick={handleRegister} className="signin-btn">Register</button>
                                </div>
                            </form>
                            {error && <div className="signin-error"> {error} </div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}