const SftpClient = require('ssh2-sftp-client');
const crypto = require('crypto');
const path = require('path');

const sftp = new SftpClient();

const {
  SFTP_HOST,
  SFTP_USER,
  SFTP_PASSWORD,
  SFTP_ROOT,
  VIDEO_BASE_URL
} = process.env;

function getRandomHex(size = 10) {
  return crypto.randomBytes(size / 2).toString('hex');
}

async function uploadVideo(localPath, businessId, originalName) {
  try {
    await sftp.connect({
      host: SFTP_HOST,
      username: SFTP_USER,
      password: SFTP_PASSWORD,
    });
    const ext = path.extname(originalName).toLowerCase();
    const randomHex = getRandomHex(10);
    const remoteDir = `${SFTP_ROOT.replace(/\/$/, '')}/${businessId}`;
    const remoteFileName = `${randomHex}${ext}`;
    const remotePath = `${remoteDir}/${remoteFileName}`;
    try {
      await sftp.mkdir(remoteDir, true);
    } catch (e) {}
    await sftp.put(localPath, remotePath);
    await sftp.end();
    const viewUrl = `${VIDEO_BASE_URL.replace(/\/$/, '')}/${businessId}/${remoteFileName}`;
    return {
      fileName: `${businessId}/${remoteFileName}`,
      viewUrl,
      downloadUrl: viewUrl,
      remotePath,
    };
  } catch (err) {
    await sftp.end();
    throw err;
  }
}

async function deleteVideo(fileName) {
  try {
    await sftp.connect({
      host: SFTP_HOST,
      username: SFTP_USER,
      password: SFTP_PASSWORD,
    });
    const remotePath = `${SFTP_ROOT.replace(/\/$/, '')}/${fileName}`;
    await sftp.delete(remotePath);
    await sftp.end();
  } catch (err) {
    await sftp.end();
    throw err;
  }
}

module.exports = {
  uploadVideo,
  deleteVideo,
};
