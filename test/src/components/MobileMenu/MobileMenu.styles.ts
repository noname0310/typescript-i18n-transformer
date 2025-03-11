import styled from "styled-components";

export const MobileMenuContainer = styled.div`
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background-color: ${(props): string => props.theme.colors.background};
    padding: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
    @media (min-width: 769px) {
        display: none;
    }
`;

export const MobileMenuItem = styled.a`
    font-size: 1rem;
    padding: 0.8rem 0;
    border-bottom: 1px solid ${(props): string => props.theme.colors.border};
    display: block;
    color: ${(props): string => props.theme.colors.text};
    text-decoration: none;
    
    &:last-child {
        border-bottom: none;
    }
`;
