import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
	experimental_extendTheme as materialExtendTheme,
	Experimental_CssVarsProvider as MaterialCssVarsProvider,
	THEME_ID as MATERIAL_THEME_ID,
} from '@mui/material/styles';
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy/styles';
import { useColorScheme as useJoyColorScheme } from '@mui/joy/styles';
import { useColorScheme as useMaterialColorScheme } from '@mui/material/styles';
import { toast } from 'sonner';
import { Typography } from '@mui/joy';
export const TemaContext = createContext<any>({} as any);

const materialTheme = materialExtendTheme();
export const darkTheme = createTheme({
	components: {
		MuiOutlinedInput: {
			styleOverrides: {
				input: {
					'&:-webkit-autofill': {
						WebkitTextFillColor: 'black'
					}
				},
			},
		},
		MuiInputLabel: {
			styleOverrides: {
				root: {
					fontWeight: 'bold',
					marginBottom: "3px"
				}
			}
		}
	},
	palette: {
		background: {
			default: '#11141e',//'#0e2b42',
			paper: 'rgb(45 42 42)'
		},
		mode: 'dark',
		primary: {
			light: '#757ce8',
			main: '#5575c0',//1642a7',
			dark: '#1b1849',
			contrastText: '#fafafa',
		},
		secondary: {
			light: '#fff',
			main: '#fafafa',
			dark: '#707070',
			contrastText: '#000',
		},

	},
	// typography: {
	// 	fontFamily: 'Poppins',
	// },
});
export const lightTheme = createTheme({
	components: {
		MuiInputLabel: {
			styleOverrides: {
				root: {
					fontWeight: 'bold',
					marginBottom: "3px"
				}
			}
		}
	},
	palette: {
		background: {
			default: '#fafafa',
			paper: '#fafafa'
		},
		secondary: {
			light: '#fff',
			main: '#5575c0',
			dark: '#707070',
			contrastText: '#fafafa',
		},
		mode: 'light'
	}
});
export const Tema = (props: any) => {
	const [rerender, setRerender] = useState(false);
	const [isDarkTheme, setIsDarkTheme] = useState<boolean>(localStorage.getItem('tema') == 'light');
	const { mode, setMode: setMaterialMode } = useMaterialColorScheme();
	const { setMode: setJoyMode } = useJoyColorScheme();
	const [changeCount, setChangeCount] = useState(0);
	useEffect(() => {
		setChangeCount(changeCount + 1);
		localStorage.setItem('tema', isDarkTheme ? 'dark' : 'light');

		setMaterialMode(isDarkTheme ? 'dark' : 'light');
		setJoyMode(isDarkTheme ? 'dark' : 'light');

	}, [isDarkTheme]);

	return (
		<ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
			<TemaContext.Provider value={{ isDarkTheme, setIsDarkTheme, rerender, setRerender }}>
				{/* @ts-ignore */}
				{props.children}
				<CssBaseline enableColorScheme />
			</TemaContext.Provider >
		</ThemeProvider>

	);
};