import React, { useState, useCallback, useRef, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage.ts';
import { PredictionService } from '../api/predict.ts';
import { useQueryClient } from '@tanstack/react-query';
import ReactCrop, { centerCrop, convertToPixelCrop, Crop, makeAspectCrop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useDebounceEffect } from './useDebounceEffect.ts';
import { canvasPreview } from './canvasPreview.ts';
import { Box, Button, CircularProgress, Grid } from '@mui/joy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from '@mui/material';
const ImageEditor: React.FC = () => {
  const ref = useRef();
  const styles = {
    border: '0.0625rem solid #9c9c9c',
    borderRadius: '0.25rem',
    width: '200px'
  };
  const [imgSrc, setImgSrc] = useState('')
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%', // Can be 'px' or '%'
    x: 25,
    y: 25,
    width: 50,
    height: 50
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [imageLoading, setImageLoading] = useState(false)
  const [mode, setMode] = useState<'crop' | 'draw'>('draw')
  const [image, setImage] = useState<File | null>(null);
  const [normalizedImageUrl, setNormalizedImageUrl] = useState<string | null>(null);
  // const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const queryClient = useQueryClient();
  const { mutate, isError, isPending, error, data } = PredictionService.useMutatePredict();
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImageLoading(true);
    setImage(acceptedFiles[0]);
    // setCrop(undefined) // Makes crop preview update between images.
    const reader = new FileReader()
    reader.addEventListener('load', () =>
      setImgSrc(reader.result?.toString() || ''),
    )
    reader.readAsDataURL(acceptedFiles[0])
  }, []);
  function base64ToBlob(dataUrl, sliceSize = 512) {
    const [prefix, base64] = dataUrl.split(',');
    const contentType = prefix.split(':')[1].split(';')[0];

    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  // This is to demonstate how to make and center a % aspect crop
  // which is a bit trickier so we use some helper functions.
  function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
  ) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    )
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    setImageLoading(false);
    // if (aspect) {
    //   const { width, height } = e.currentTarget
    //   setCrop(centerAspectCrop(width, height, aspect))
    // }
  }

  // async function onDownloadCropClick() {
  //   const image = imgRef.current
  //   const previewCanvas = previewCanvasRef.current
  //   if (!image || !previewCanvas || !completedCrop) {
  //     throw new Error('Crop canvas does not exist')
  //   }

  //   // This will size relative to the uploaded image
  //   // size. If you want to size according to what they
  //   // are looking at on screen, remove scaleX + scaleY
  //   const scaleX = image.naturalWidth / image.width
  //   const scaleY = image.naturalHeight / image.height

  //   const offscreen = new OffscreenCanvas(
  //     completedCrop.width * scaleX,
  //     completedCrop.height * scaleY,
  //   )
  //   const ctx = offscreen.getContext('2d')
  //   if (!ctx) {
  //     throw new Error('No 2d context')
  //   }

  //   ctx.drawImage(
  //     previewCanvas,
  //     0,
  //     0,
  //     previewCanvas.width,
  //     previewCanvas.height,
  //     0,
  //     0,
  //     offscreen.width,
  //     offscreen.height,
  //   )
  //   // You might want { type: "image/jpeg", quality: <0 to 1> } to
  //   // reduce image size
  //   const blob = await offscreen.convertToBlob({
  //     type: 'image/png',
  //   })

  //   if (blobUrlRef.current) {
  //     URL.revokeObjectURL(blobUrlRef.current)
  //   }
  //   blobUrlRef.current = URL.createObjectURL(blob)

  //   if (hiddenAnchorRef.current) {
  //     hiddenAnchorRef.current.href = blobUrlRef.current
  //     hiddenAnchorRef.current.click()
  //   }
  // }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate,
        )
      }
    },
    100,
    [completedCrop, scale, rotate],
  )
  const handleUpload = async () => {
    if (image && mode == "crop") {
      const croppedImage = await getCroppedImg(image, completedCrop as PixelCrop);
      var croppedImageCanvas = document.getElementById('cropped-image') as HTMLCanvasElement
      croppedImageCanvas.toBlob((blob) => {
        mutate({ blob });
      });
    }
    else if (mode == "draw") {
      //@ts-ignore
      ref.current.exportImage("png")
        .then(data => {
          console.log(data)
          mutate({ blob: base64ToBlob(data) })
        })
    }
  };

  useEffect(() => {
    if (data?.normalized_image) {
      setNormalizedImageUrl(`data:image/png;base64,${data?.normalized_image}`)
      // const blob = new Blob([data?.normalized_image], { type: 'image/png' });
      // const url = URL.createObjectURL(blob);
      // setNormalizedImageUrl(url);
    }
  }, [data]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode((event.target as HTMLInputElement).value as 'crop' | 'draw');
  };
  return (
    <Box>
      <Typography variant="h4">RNA identificação de algarismos arábicos</Typography>
      <br />
      <FormControl component="fieldset">
        <FormLabel component="legend">Mode</FormLabel>
        <RadioGroup row aria-label="mode" name="mode" value={mode} onChange={handleChange}>
          <FormControlLabel value="crop" control={<Radio />} label="Recortar" />
          <FormControlLabel value="draw" control={<Radio />} label="Desenhar" />
        </RadioGroup>
      </FormControl>
      {mode == "crop" &&
        <Dropzone
          onDrop={onDrop}
        // accept="image/*"
        >
          {({ getRootProps, getInputProps }) => (
            <Box {...getRootProps()}
              border={1}
              padding={2}
              marginBottom={2}
              sx={{
                // background: 'light.green',
                color: 'inherit',
                height: '120px'
              }}
            >
              <input {...getInputProps()} />
              <Typography>Arraste uma imagem ou clique aqui.</Typography>
              {imageLoading ? <CircularProgress sx={{ mt: 1 }} />
                :
                <UploadFileIcon sx={{ height: '50px', width: '50px', mt: 1 }} />
              }
            </Box>
          )}
        </Dropzone>
      }

      <br />
      <Box sx={{ textAlign: '-webkit-center' }}>
        <Grid container spacing={5} sx={{ width: '50%', '.MuiGrid-root': { alignContent: 'center' } }}>
          <Grid md={4}>
            <Box>
              {!!imgSrc && mode == "crop" && (
                <>
                  {/* <Typography>Clique na imagem e selecione seu recorte</Typography> */}
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                  // aspect={aspect}
                  // minWidth={400}
                  // minHeight={100}
                  // circularCrop
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </>
              )}
              {mode == "draw" &&
                <>
                  <Typography>Desenhe o número</Typography>
                  <ReactSketchCanvas
                    ref={ref}
                    style={styles}
                    width="200"
                    height="200"
                    strokeWidth={15}
                    strokeColor="black"
                  />
                  <br />
                  {/* @ts-ignore */}
                  <Button onClick={() => ref?.current?.clearCanvas()}>
                    Limpar
                  </Button>
                </>
              }
            </Box>
          </Grid>
          {!!completedCrop && mode == "crop" && (
            <Grid md={4}>
              <>
                <div>
                  <canvas
                    ref={previewCanvasRef}
                    id="cropped-image"
                    style={{
                      border: '1px solid black',
                      objectFit: 'contain',
                      width: completedCrop.width,
                      height: completedCrop.height,
                    }}
                  />
                </div>
              </>
            </Grid>
          )}
          <Grid md={2}>

            <Button
              variant="outlined"
              color="primary"
              onClick={handleUpload}
            // disabled={!image || isPending}
            >
              Identificar
            </Button>
          </Grid>
          <Grid md={4}>
            {data?.normalized_image && (
              <Box>
                <img
                  src={normalizedImageUrl}
                  alt="Original"
                  style={{ maxWidth: '100%' }}
                />
                {isPending && <Typography>Loading...</Typography>}
                {error && <Typography>Error: {error?.message}</Typography>}
                {data &&
                  <>
                    <Typography>Predições:
                    </Typography>

                    {data?.predicted_label.map((label, index) => (
                      <span key={index}>{label}<br/></span>
                    ))}
                  </>
                }
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* {data?.normalized_image && (
        <Box marginBottom={2}>
          <img src={data?.normalized_image} alt="Cropped" style={{ maxWidth: '100%' }} />
        </Box>
      )} */}
    </Box>
  );
};

export default ImageEditor;