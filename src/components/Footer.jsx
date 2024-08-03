import React from "react";
import { PestDocLogo } from "../components/PestDoc-Logo.jsx";
import "../styles/Footer.css";

export default function MyFooter() {
  return (
    <footer>
      <section>
        <div style={{ paddingTop: "100px" }}>
          <h1 style={{ textAlign: "center" }}>
            Consultation With <span style={{ color: "#00C1DF" }}>Pest-Doc AI</span>
          </h1>
          <p style={{ textAlign: "center" }}>Welcome to PestDoc-AI, your reliable pest consultation companion.</p>
        </div>
        <hr style={{ borderTop: "1px solid #00C1DF", width: "17%", margin: "0 auto" }} />
        <h1 style={{ textAlign: "center", paddingTop: "70px" }}>Download Now</h1>
        <div className="app-2">
          <img src="assets/Google-Play.svg" alt="Google-Play" />
          <img src="assets/App-Store.svg" alt="App-Store" />
        </div>
      </section>
      <div className="footer">
        <div className="row">
          <div className="footer-col">
            <h4>
              Pest<span style={{ fontWeight: "normal" }}>Doc</span>-AI
            </h4>
            <p style={{ fontSize: "13px" }}>Lorem ipsum dolor sit amet consectetur adipiscing elit aliquman</p>
            <div className="social-links">
              <a href="#">
                <i>
                  <img src="../assets/Facebook.svg" alt="Facebook" />
                </i>
              </a>
              <a href="#">
                <i>
                  <img src="../assets/Twitter.svg" alt="Twitter" />
                </i>
              </a>
              <a href="#">
                <i>
                  <img src="../assets/Instagram.svg" alt="Instagram" />
                </i>
              </a>
              <a href="#">
                <i>
                  <img src="../assets/Linkedin.svg" alt="Linkedin" />
                </i>
              </a>
              <a href="#">
                <i>
                  <img src="../assets/Youtube.svg" alt="Youtube" />
                </i>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#">Features</a>
              </li>
              <li>
                <a href="#">Pricing</a>
              </li>
              <li>
                <a href="#">Case Studies</a>
              </li>
              <li>
                <a href="#">Reviews</a>
              </li>
              <li>
                <a href="#">Updates</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Contact us</a>
              </li>
              <li>
                <a href="#">Careers</a>
              </li>
              <li>
                <a href="#">Culture</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li>
                <a href="#">Getting started</a>
              </li>
              <li>
                <a href="#">Help center</a>
              </li>
              <li>
                <a href="#">Server status</a>
              </li>
              <li>
                <a href="#">Report a bug</a>
              </li>
              <li>
                <a href="#">Chat support</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul>
              <li>contact@company.com</li>
              <li>(414) 687 - 5892</li>
              <li>794 Mcallister St San Fransisco 94102</li>
            </ul>
          </div>
        </div>
      </div>
      <hr className="centered-hr" />
      <div className="copyright">
        <p>Copyright &copy; 2024 PestDocAI</p>
        <p style={{ display: "flex", float: "right", paddingRight: "80px" }}>
          All Rights Reserved | <a href="">Terms and Conditions</a> |<a href="">Privacy Policy</a>
        </p>
      </div>
    </footer>
  );
}
