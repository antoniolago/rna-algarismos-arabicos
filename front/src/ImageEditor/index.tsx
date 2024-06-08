import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Button, Typography, Slider } from '@mui/material';
import Dropzone from 'react-dropzone';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage.ts';
import { PredictionService } from '../api/predict.ts';
import { useQueryClient } from '@tanstack/react-query';
import ReactCrop, { centerCrop, convertToPixelCrop, Crop, makeAspectCrop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useDebounceEffect } from './useDebounceEffect.ts';
import { canvasPreview } from './canvasPreview.ts';

const ImageEditor: React.FC = () => {

  const [imgSrc, setImgSrc] = useState('')
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
  const blobUrlRef = useRef('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(16 / 9)
  const [image, setImage] = useState<File | null>(null);
  const [normalizedImageUrl, setNormalizedImageUrl] = useState<string | null>(null);
  // const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const queryClient = useQueryClient();
  const { mutate, isError, isPending, error, data } = PredictionService.useMutatePredict();
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImage(acceptedFiles[0]);
    setCrop(undefined) // Makes crop preview update between images.
    const reader = new FileReader()
    reader.addEventListener('load', () =>
      setImgSrc(reader.result?.toString() || ''),
    )
    reader.readAsDataURL(acceptedFiles[0])
  }, []);

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
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
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
    if (image) {
      // const blob = await fetch(image).then((res) => res.blob());
      // // const file = new File([blob], 'croppedImage.png', { type: 'image/png' });
      // // console.log(blob)
      mutate({ blob: image });
    }
  };

  useEffect(() => {
    if (data?.normalized_image) {
      const blob = new Blob([data?.normalized_image], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setNormalizedImageUrl(url);
    }
  }, [data]);

  return (
    <Box>
      <Typography variant="h4">Image Editor</Typography>
      <br />
      <Dropzone
        onDrop={onDrop}
      // accept="image/*"
      >
        {({ getRootProps, getInputProps }) => (
          <Box {...getRootProps()} border={1} padding={2} marginBottom={2}>
            <input {...getInputProps()} />
            <Typography>Drag 'n' drop an image here, or click to select one</Typography>
          </Box>
        )}
      </Dropzone>
      <br />
      {image && (
        <Box position="relative" sx={{ display: 'flex', height: '150px' }} width="100%" height={400} marginBottom={2}>
          {!!imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              // aspect={aspect}
              // minWidth={400}
              minHeight={100}
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
          )}
          {!!completedCrop && (
            <>
              <div>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    border: '1px solid black',
                    objectFit: 'contain',
                    width: completedCrop.width,
                    height: completedCrop.height,
                  }}
                />
              </div>
            </>
          )}
          {data?.normalized_image && (
            <Box>
              <img
                src={normalizedImageUrl}
                alt="Original"
                style={{ maxWidth: '100%' }}
              />
            </Box>
          )}
          {/* <ReactCrop crop={crop} onChange={c => setCrop(c)}>
            <img src={URL.createObjectURL(data?.image)} />
          </ReactCrop> */}
        </Box>
      )}
      {/* {data?.normalized_image && (
        <Box marginBottom={2}>
          <img src={data?.normalized_image} alt="Cropped" style={{ maxWidth: '100%' }} />
        </Box>
      )} */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload} disabled={!image || isPending}>
        Upload & Predict
      </Button>
      {isPending && <Typography>Loading...</Typography>}
      {error && <Typography>Error: {error?.message}</Typography>}
      {data && <Typography>Prediction: {data?.predicted_label}</Typography>}
    </Box>
  );
};

export default ImageEditor;