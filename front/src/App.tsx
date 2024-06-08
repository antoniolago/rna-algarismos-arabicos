import { useState } from 'react'
import {
  experimental_extendTheme as materialExtendTheme,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  THEME_ID as MATERIAL_THEME_ID,
} from '@mui/material/styles';
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy/styles';
import './App.css'
import ImageEditor from './ImageEditor'
import { CssBaseline } from '@mui/joy';

const materialTheme = materialExtendTheme({});
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <MaterialCssVarsProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }} defaultMode="dark">
        <JoyCssVarsProvider>
          <CssBaseline enableColorScheme />
          <ImageEditor />
        </JoyCssVarsProvider>
      </MaterialCssVarsProvider>
    </>
  )
}

export default App
