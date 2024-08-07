import { Navbar, NavbarContent, NavbarItem, Button } from "@nextui-org/react";
import { PestDocLogo } from "./PestDoc-Logo.jsx";

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
          <a href="/" style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
            Home
          </a>
        </NavbarItem>
        <NavbarItem>
          <a href="/blog" style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
            Blog
          </a>
        </NavbarItem>
        <NavbarItem>
          <a href="/about-us" style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
            About
          </a>
        </NavbarItem>
        <NavbarItem>
          <a href="/contact" style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
            Contact
          </a>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Button style={{ color: "white", backgroundColor: "#00C1DF", borderRadius: "8px", width: "140px" }} href="#" variant="flat">
            Download
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
