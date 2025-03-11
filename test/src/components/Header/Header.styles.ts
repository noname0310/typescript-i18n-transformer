import styled from "styled-components";

export const HeaderContainer = styled.header`
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

export const Logo = styled.div`
    font-weight: 700;
    font-size: 1.5rem;
`;

export const Nav = styled.nav`
    display: flex;
    align-items: center;
    gap: 2rem;

    @media (max-width: 768px) {
        display: none;
    }
`;

export const NavItem = styled.a`
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0.8;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 1;
    }
`;

export const MobileMenuButton = styled.button`
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
