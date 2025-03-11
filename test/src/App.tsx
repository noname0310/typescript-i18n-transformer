import type { JSX } from "react";
import { useState } from "react";
import styled, { createGlobalStyle, ThemeProvider } from "styled-components";

import { useI18n } from "./I18n";

// Global styles
const GlobalStyle = createGlobalStyle`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        background: #000;
        color: #fff;
        line-height: 1.6;
    }

    a {
        color: inherit;
        text-decoration: none;
    }
`;

// Theme
const theme = {
    colors: {
        primary: "#fff",
        secondary: "#888",
        accent: "#0070f3",
        background: "#000",
        backgroundAlt: "#111"
    }
};

// Styled Components
const Container = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
`;

const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 0;
    position: sticky;
    top: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    z-index: 100;
`;

const Logo = styled.div`
    font-weight: 700;
    font-size: 1.5rem;
`;

const Nav = styled.nav`
    display: flex;
    align-items: center;
    gap: 2rem;

    @media (max-width: 768px) {
        display: none;
    }
`;

const NavItem = styled.a`
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0.8;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 1;
    }
`;

const MobileMenuButton = styled.button`
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    display: none;

    @media (max-width: 768px) {
        display: block;
    }
`;

const Button = styled.a<{ primary?: boolean }>`
    background: ${(props): string => props.primary ? props.theme.colors.accent : "transparent"};
    color: ${(props): string => props.primary ? "#fff" : props.theme.colors.primary};
    border: ${(props): string => props.primary ? "none" : "1px solid rgba(255, 255, 255, 0.2)"};
    padding: 0.6rem 1.2rem;
    border-radius: 5px;
    font-weight: 500;
    transition: all 0.2s ease;
    display: inline-block;
    cursor: pointer;

    &:hover {
        background: ${(props): string => props.primary ? "#0056b3" : "rgba(255, 255, 255, 0.1)"};
    }
`;

const Hero = styled.section`
    padding: 6rem 0 4rem;
    text-align: center;
`;

const HeroTitle = styled.h1`
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(to right, #fff, #aaa);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    
    @media (max-width: 768px) {
        font-size: 2.5rem;
    }
`;

const HeroSubtitle = styled.p`
    font-size: 1.5rem;
    color: ${(props): string => props.theme.colors.secondary};
    max-width: 600px;
    margin: 0 auto 2rem;

    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 2rem 0;
`;

const AnimatedGradient = styled.div`
    margin: 4rem auto;
    width: 80%;
    max-width: 800px;
    height: 400px;
    background: linear-gradient(45deg, #0070f3, #7928ca, #ff0080);
    background-size: 600% 600%;
    animation: gradientAnimation 10s ease infinite;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.5);

    @keyframes gradientAnimation {
        0% { background-position: 0% 50% }
        50% { background-position: 100% 50% }
        100% { background-position: 0% 50% }
    }
`;

const FeaturesSection = styled.section`
    padding: 4rem 0;
`;

const SectionTitle = styled.h2`
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 3rem;
    text-align: center;
`;

const FeatureGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
`;

const FeatureCard = styled.div`
    background: ${(props): string => props.theme.colors.backgroundAlt};
    padding: 2rem;
    border-radius: 8px;
    transition: transform 0.3s ease;

    &:hover {
        transform: translateY(-5px);
    }
`;

const FeatureIcon = styled.div`
    font-size: 2rem;
    margin-bottom: 1rem;
    color: ${(props): string => props.theme.colors.accent};
`;

const FeatureTitle = styled.h3`
    font-size: 1.5rem;
    margin-bottom: 1rem;
`;

const FeatureDescription = styled.p`
    color: ${(props): string => props.theme.colors.secondary};
`;

const CustomersSection = styled.section`
    padding: 4rem 0;
    text-align: center;
`;

const LogoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 2rem;
    align-items: center;
    max-width: 800px;
    margin: 0 auto;
`;

const CustomerLogo = styled.div`
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    filter: grayscale(1);
    transition: opacity 0.3s ease, filter 0.3s ease;

    &:hover {
        opacity: 1;
        filter: grayscale(0);
    }
`;

const CTASection = styled.section`
    padding: 4rem 0;
    text-align: center;
    background: ${(props): string => props.theme.colors.backgroundAlt};
    border-radius: 10px;
    margin: 2rem 0;
`;

const Footer = styled.footer`
    padding: 3rem 0;
    background: ${(props): string => props.theme.colors.background};
`;

const FooterGrid = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 2rem;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr 1fr;
    }
    
    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const FooterColumn = styled.div``;

const FooterTitle = styled.h4`
    font-size: 1rem;
    margin-bottom: 1rem;
`;

const FooterLinks = styled.ul`
    list-style: none;
`;

const FooterLink = styled.li`
    margin-bottom: 0.7rem;
    
    a {
        color: ${(props): string => props.theme.colors.secondary};
        transition: color 0.2s ease;
        font-size: 0.9rem;
        
        &:hover {
            color: ${(props): string => props.theme.colors.primary};
        }
    }
`;

const Copyright = styled.div`
    margin-top: 3rem;
    color: ${(props): string => props.theme.colors.secondary};
    font-size: 0.9rem;
    text-align: center;
`;

// Main App Component
export function App(): JSX.Element {
    const i = useI18n();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <Container>
                <Header>
                    <Logo>{i.locText("DEVFLOW")}</Logo>
                    <Nav>
                        <NavItem href="#features">{i.locText("Features")}</NavItem>
                        <NavItem href="#customers">{i.locText("Customers")}</NavItem>
                        <NavItem href="#pricing">{i.locText("Pricing")}</NavItem>
                        <NavItem href="#docs">{i.locText("Documentation")}</NavItem>
                        <Button>{i.locText("Log In")}</Button>
                        <Button primary>{i.locText("Sign Up")}</Button>
                    </Nav>
                    <MobileMenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        ☰
                    </MobileMenuButton>
                </Header>

                <Hero>
                    <HeroTitle>{i.locText("Deploy Your Code with Confidence")}</HeroTitle>
                    <HeroSubtitle>
                        {i.locText("The platform for developers to deploy, scale, and secure modern web applications.")}
                    </HeroSubtitle>
                    <ButtonGroup>
                        <Button primary>{i.locText("Get Started")}</Button>
                        <Button>{i.locText("View Documentation")}</Button>
                    </ButtonGroup>
                    <AnimatedGradient>
                        <img src="/api/placeholder/600/300" alt={i.locText("Platform Demo")} />
                    </AnimatedGradient>
                </Hero>

                <FeaturesSection id="features">
                    <SectionTitle>{i.locText("Powerful Features for Modern Development")}</SectionTitle>
                    <FeatureGrid>
                        <FeatureCard>
                            <FeatureIcon>⚡</FeatureIcon>
                            <FeatureTitle>{i.locText("Instant Deployment")}</FeatureTitle>
                            <FeatureDescription>
                                {i.locText("Deploy directly from your Git repository with zero configuration and go live in seconds.")}
                            </FeatureDescription>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>🌐</FeatureIcon>
                            <FeatureTitle>{i.locText("Global CDN")}</FeatureTitle>
                            <FeatureDescription>
                                {i.locText("Your applications are automatically distributed across our global edge network.")}
                            </FeatureDescription>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>🛡️</FeatureIcon>
                            <FeatureTitle>{i.locText("Built-in Security")}</FeatureTitle>
                            <FeatureDescription>
                                {i.locText("SSL certificates, DDoS protection, and more security features included by default.")}
                            </FeatureDescription>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>📊</FeatureIcon>
                            <FeatureTitle>{i.locText("Analytics & Insights")}</FeatureTitle>
                            <FeatureDescription>
                                {i.locText("Gain valuable insights into your application's performance and user behavior.")}
                            </FeatureDescription>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>🔄</FeatureIcon>
                            <FeatureTitle>{i.locText("Continuous Integration")}</FeatureTitle>
                            <FeatureDescription>
                                {i.locText("Automatically build, test, and deploy your code with every push to your repository.")}
                            </FeatureDescription>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>📱</FeatureIcon>
                            <FeatureTitle>{i.locText("Responsive Previews")}</FeatureTitle>
                            <FeatureDescription>
                                {i.locText("Test your application on different devices and screen sizes before going live.")}
                            </FeatureDescription>
                        </FeatureCard>
                    </FeatureGrid>
                </FeaturesSection>

                <CustomersSection id="customers">
                    <SectionTitle>{i.locText("Trusted by Innovative Teams")}</SectionTitle>
                    <LogoGrid>
                        <CustomerLogo>{i.locText("Company A")}</CustomerLogo>
                        <CustomerLogo>{i.locText("Company B")}</CustomerLogo>
                        <CustomerLogo>{i.locText("Company C")}</CustomerLogo>
                        <CustomerLogo>{i.locText("Company D")}</CustomerLogo>
                        <CustomerLogo>{i.locText("Company E")}</CustomerLogo>
                        <CustomerLogo>{i.locText("Company F")}</CustomerLogo>
                    </LogoGrid>
                </CustomersSection>

                <CTASection>
                    <SectionTitle>{i.locText("Ready to Transform Your Development Workflow?")}</SectionTitle>
                    <HeroSubtitle>
                        {i.locText("Join thousands of developers who are shipping faster with our platform.")}
                    </HeroSubtitle>
                    <ButtonGroup>
                        <Button primary>{i.locText("Start for Free")}</Button>
                        <Button>{i.locText("Schedule a Demo")}</Button>
                    </ButtonGroup>
                </CTASection>

                <Footer>
                    <FooterGrid>
                        <FooterColumn>
                            <Logo>{i.locText("DEVFLOW")}</Logo>
                            <FooterLink>
                                <a href="#">
                                    {i.locText("The platform for modern web development. Deploy instantly, scale automatically, and serve globally.")}
                                </a>
                            </FooterLink>
                        </FooterColumn>
                        <FooterColumn>
                            <FooterTitle>{i.locText("Product")}</FooterTitle>
                            <FooterLinks>
                                <FooterLink><a href="#">{i.locText("Features")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Pricing")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Marketplace")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Enterprise")}</a></FooterLink>
                            </FooterLinks>
                        </FooterColumn>
                        <FooterColumn>
                            <FooterTitle>{i.locText("Resources")}</FooterTitle>
                            <FooterLinks>
                                <FooterLink><a href="#">{i.locText("Documentation")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Guides")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Blog")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Support")}</a></FooterLink>
                            </FooterLinks>
                        </FooterColumn>
                        <FooterColumn>
                            <FooterTitle>{i.locText("Company")}</FooterTitle>
                            <FooterLinks>
                                <FooterLink><a href="#">{i.locText("About")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Careers")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Contact")}</a></FooterLink>
                                <FooterLink><a href="#">{i.locText("Legal")}</a></FooterLink>
                            </FooterLinks>
                        </FooterColumn>
                    </FooterGrid>
                    <Copyright>
                        {i.locText("© 2025 DevFlow, Inc. All rights reserved.")}
                    </Copyright>
                </Footer>
            </Container>
        </ThemeProvider>
    );
};
