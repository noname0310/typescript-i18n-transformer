import styled from "styled-components";

export const FooterContainer = styled.footer`
    margin-top: 6rem;
    padding: 4rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const FooterGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
`;

export const FooterColumn = styled.div``;

export const FooterTitle = styled.h4`
    font-size: 1rem;
    margin-bottom: 1rem;
`;

export const FooterLinks = styled.ul`
    list-style: none;
`;

export const FooterLink = styled.li`
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

export const Copyright = styled.div`
    margin-top: 3rem;
    color: ${(props): string => props.theme.colors.secondary};
    font-size: 0.9rem;
    text-align: center;
`;
