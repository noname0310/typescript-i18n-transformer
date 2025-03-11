import styled from "styled-components";

export const LanguageSelector = styled.select`
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid ${(props): string => props.theme.colors.border};
    background-color: ${(props): string => props.theme.colors.background};
    color: ${(props): string => props.theme.colors.text};
    font-size: 0.9rem;
    cursor: pointer;
    margin-right: 1rem;
    
    &:focus {
        outline: none;
        border-color: ${(props): string => props.theme.colors.primary};
    }
`;

export const MobileLanguageSelector = styled(LanguageSelector)`
    margin: 1rem 0;
    width: 100%;
`;
