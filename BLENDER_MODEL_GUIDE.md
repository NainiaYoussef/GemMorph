# Blender Model Integration Guide

## How to Use Your Blender Models in GemMorph

### Step 1: Export from Blender

1. Open your Blender model
2. Go to **File → Export → glTF 2.0 (.glb/.gltf)**
3. Choose **glTF Binary (.glb)** format (recommended - single file)
   - Or **glTF (.gltf)** format (separate files)
4. Save your model file

### Step 2: Add Model to Project

**Option A: Local File (for development)**
1. Place your `.glb` or `.gltf` file in `jewelry-ui/assets/models/`
2. Update the model URL in `app/(tabs)/index.tsx`:
   ```typescript
   setMorphedModelUrl(require('@/assets/models/your-model.glb'));
   ```

**Option B: Hosted URL (for production)**
1. Upload your model to a hosting service (AWS S3, Cloudinary, etc.)
2. Update the model URL:
   ```typescript
   setMorphedModelUrl('https://your-server.com/models/your-model.glb');
   ```

### Step 3: Backend Integration

In `app/(tabs)/index.tsx`, replace the placeholder code in `handleMorphGem()`:

```typescript
const handleMorphGem = async () => {
  if (!uploadedImage) return;

  setIsMorphing(true);
  
  try {
    // Call your backend API
    const formData = new FormData();
    formData.append('image', {
      uri: uploadedImage,
      type: 'image/jpeg',
      name: 'jewelry.jpg',
    });

    const response = await fetch('YOUR_BACKEND_API_URL/morph', {
      method: 'POST',
      body: formData,
    });

    const { modelUrl } = await response.json();
    setMorphedModelUrl(modelUrl);
    setShowModel(true);
  } catch (error) {
    console.error('Error morphing:', error);
    alert('Failed to transform image. Please try again.');
  } finally {
    setIsMorphing(false);
  }
};
```

### Supported Formats

- ✅ **GLB** (recommended) - Binary glTF, single file
- ✅ **GLTF** - Text-based glTF format
- ❌ OBJ, FBX, DAE - Not directly supported (convert to GLB first)

### Model Requirements

- **File Size**: Keep under 10MB for best performance
- **Polygon Count**: Optimize for web (under 50k triangles recommended)
- **Textures**: Embedded in GLB or as separate files for GLTF
- **Materials**: PBR materials work best

### Tips for Best Results

1. **Optimize in Blender**:
   - Use Decimate modifier to reduce polygons
   - Compress textures
   - Remove unnecessary objects

2. **Export Settings**:
   - ✅ Include Materials
   - ✅ Include Textures
   - ✅ Apply Modifiers
   - ✅ Selected Objects Only (if needed)

3. **Testing**:
   - Test on web first (easiest)
   - Check mobile performance
   - Verify lighting looks good

### Example Model URLs

For testing, you can use these sample models:
- Duck: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb`
- More samples: https://github.com/KhronosGroup/glTF-Sample-Models

### Troubleshooting

**Model not loading?**
- Check file path/URL is correct
- Verify file is accessible (CORS for hosted files)
- Check browser console for errors

**Model looks wrong?**
- Ensure materials are exported
- Check texture paths (for GLTF)
- Verify scale is appropriate

**Performance issues?**
- Reduce polygon count
- Compress textures
- Use GLB instead of GLTF

### Next Steps

1. Export your Blender jewelry model as GLB
2. Add it to the project or host it
3. Update the `morphedModelUrl` in the code
4. Test the 3D viewer!

