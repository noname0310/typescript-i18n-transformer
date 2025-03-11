import { createGlobalStyle } from "styled-components";

// Global styles
export const GlobalStyle = createGlobalStyle`
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
