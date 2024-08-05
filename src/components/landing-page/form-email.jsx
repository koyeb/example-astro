import React from "react";
import { Button, Input } from "@nextui-org/react";

export default function FormEmailLandingPage() {
    return (
        <div className="flex flex-col gap-20">
            <div className="flex flex-row gap-2.5 items-center">
                <Input type="email" label="Email" client:visible/>
                <Button className="bg-[#00FFFF] text-[#000000] font-medium" size="lg">
                    Button
                </Button>
            </div>
            <div className="flex flex-row gap-4">
                <img src="/instagram.svg" alt="logo instagram" width="32" />
                <img src="/tiktok.svg" alt="logo tiktok" width="32" />
            </div>
        </div>
    );
}