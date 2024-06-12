import React from "react";
import { Navbar, NavbarContent, NavbarItem, Link, Button } from "@nextui-org/react";
import { PestDocLogo } from "../components/PestDoc-Logo.jsx";

export default function MyNavbar() {
  return (
    <Navbar isBordered style={{ position: "sticky", top: 0, zIndex: 1000 }}>
      <NavbarContent>
        <NavbarItem style={{ display: "flex", alignItems: "center" }}>
          <PestDocLogo className="PestDocLogo" style={{ position: "absolute" }} />
          <p className="text-inherit" style={{ marginLeft: "10px", marginBottom: "0", fontWeight: "bold" }}>
            Pest<span style={{ fontWeight: "normal" }}>Doc</span>
            <span style={{ fontWeight: "bold" }}>-AI</span>
          </p>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent style={{ flex: 1 }} justify="center">
        <NavbarItem>
          <Link color="foreground" href="#">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="#" color="foreground" aria-current="page">
            Blog
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="#">
            About
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="#">
            Contact
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Button as={Link} style={{ color: "white", backgroundColor: "#00C1DF", borderRadius: "8px", width: "140px" }} href="#" variant="flat">
            Download
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
