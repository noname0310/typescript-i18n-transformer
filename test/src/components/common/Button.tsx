import styled from "styled-components";

export const Button = styled.a<{ primary?: boolean }>`
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
