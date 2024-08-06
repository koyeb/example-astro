import React, { useState } from 'react';
import axios from 'axios';
import {Button, Input, useDisclosure} from "@nextui-org/react";

const InterestEmailForm = () => {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (email === '' || email === null) {
                return setErrorMessage('Please enter a valid email');
            }

            const response = await axios.post('https://real-benoite-pestdoc.koyeb.app/api/web/interest-email', {
                email,
            });

            console.log('response.data : ', response.data);

            if (response.status === 201) {
                setSuccessMessage("Submit successfully.");
                setErrorMessage("");
                window.alert("Success");
            } else {
                setSuccessMessage("");
                setErrorMessage("Submit failed.");
                window.alert("Failed");
            }
        } catch (error) {
            if (error.response.status === 400) {
                setErrorMessage(error.response.data.message);
                window.alert(error.response.data.message);
            } else {
                setErrorMessage('An error occurred. Please try again.');
                window.alert("Something went wrong");
            }
            setSuccessMessage('');
        }
    };

    return (
            <form onSubmit={handleSubmit} className="flex flex-row gap-2.5 items-center z-20">
                <Input
                    type="email"
                    label="Email"
                    errorMessage={errorMessage}
                    isInvalid={errorMessage !== ''}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    client:visible
                />
                <Button
                    type="submit"
                    className="bg-gradient-to-tr from-[#B8E7BD] to-[#35BA8F] text-white font-medium h-[56px]"
                    size="lg"
                    client:visible
                >
                    Notify me
                </Button>
            </form>
    );
};

export default InterestEmailForm;
