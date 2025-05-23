const sftpStorage = require('../utils/sftp');
const businessController = require('./businessController');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const axios = require('axios');

const ALLOWED_VIDEO_TYPES = ['.mp4', '.mov', '.avi', '.wmv'];
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ASPECT_CONFIG = {
  '4:5': { w: 1080, h: 1350, ratio: 4 / 5 },
  '1:1': { w: 1080, h: 1080, ratio: 1 },
  '9:16': { w: 1080, h: 1920, ratio: 9 / 16 }
};

async function uploadVideoForProduct(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    if (!activeBusiness) {
      return res.status(404).json({ success: false, message: 'No active business found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }
    const file = req.file;
    const productId = req.body.productId;
    const aspectKey = req.body.aspect;
    let ext = path.extname(file.originalname).toLowerCase();
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the maximum limit of 100MB'
      });
    }
    if (!ALLOWED_VIDEO_TYPES.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`
      });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    if (!ASPECT_CONFIG[aspectKey]) {
      return res.status(400).json({ success: false, message: 'Invalid aspect ratio selected' });
    }
    const { w: targetW, h: targetH, ratio: targetRatio } = ASPECT_CONFIG[aspectKey];
    const ffprobe = spawn(ffmpegPath, [
      '-i', file.path,
      '-hide_banner'
    ]);
    let probeData = '';
    ffprobe.stderr.on('data', d => probeData += d.toString());
    await new Promise(resolve => ffprobe.on('close', resolve));
    let match = probeData.match(/Stream.*Video.* ([0-9]+)x([0-9]+)/);
    if (!match) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: 'Could not detect video size' });
    }
    const origW = parseInt(match[1]);
    const origH = parseInt(match[2]);
    const origRatio = origW / origH;
    const minAspect = targetRatio - 0.03;
    const maxAspect = targetRatio + 0.03;
    if (origRatio < minAspect || origRatio > maxAspect) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: 'Video aspect ratio does not match selected option.' });
    }
    const tempOut = file.path.replace(ext, '.resized' + ext);

    // INÍCIO DO AJUSTE: capturando stderr do ffmpeg
    await new Promise((resolve, reject) => {
      let ffmpegError = '';
      const ff = spawn(ffmpegPath, [
        '-y',
        '-i', file.path,
        '-vf', `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}`,
        '-c:a', 'copy',
        tempOut
      ]);
      ff.stderr.on('data', data => ffmpegError += data.toString());
      ff.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error('ffmpeg resize failed: ' + ffmpegError));
      });
    });
    // FIM DO AJUSTE

    const uploadResult = await sftpStorage.uploadVideo(tempOut, activeBusiness._id, `product-${productId}-${Date.now()}${ext}`);
    fs.unlinkSync(file.path);
    fs.unlinkSync(tempOut);

    // SALVA NO PRODUTO USANDO O POST PARA O producteditor
    const productEditorUrl = process.env.API_PROD_EDITOR;
    const apiKey = process.env.API_AUTH_KEY;
    const saveResp = await axios.post(
      productEditorUrl,
      {
        businessId: activeBusiness._id,
        products: [
          {
            productId: productId,
            videolinkurl: uploadResult.downloadUrl
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      }
    );

    // repassa o sucesso do producteditor pro frontend
    return res.status(201).json({
      success: saveResp.data.success,
      message: saveResp.data.message,
      video: { downloadUrl: uploadResult.downloadUrl }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error uploading video: ' + error.message
    });
  }
}

async function deleteVideoForProduct(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    if (!activeBusiness) {
      return res.status(404).json({ success: false, message: 'No active business found' });
    }
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' });

    // você pode obter o videolinkurl do produto com uma busca, depende da sua lógica,
    // supondo que venha no req.body.videolinkurl (ajuste se necessário)
    const videoUrl = req.body.videolinkurl; // ou buscar do banco

    if (videoUrl) {
      const filename = videoUrl.split('/').slice(-2).join('/');
      await sftpStorage.deleteVideo(filename);
    }

    // Faz o POST para o producteditor para limpar o campo
    const productEditorUrl = process.env.API_PROD_EDITOR;
    const apiKey = process.env.API_AUTH_KEY;
    const saveResp = await axios.post(
      productEditorUrl,
      {
        businessId: activeBusiness._id,
        products: [
          {
            productId: productId,
            videolinkurl: null
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      }
    );

    return res.json({ success: saveResp.data.success, message: saveResp.data.message });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting product video: ' + error.message
    });
  }
}

module.exports = {
  uploadVideoForProduct,
  deleteVideoForProduct
};
