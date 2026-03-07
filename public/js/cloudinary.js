// public/js/cloudinary.js
// ─────────────────────────────────────────────────────
//  Cloudinary upload helpers — profile photos + certificates
//  Cloud name: ds1wxopgy  |  Preset: Case-V1 (unsigned)
// ─────────────────────────────────────────────────────

const CLOUD_NAME    = 'ds1wxopgy';
const UPLOAD_PRESET = 'Case-V1';

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// Profile photo: 400×400 face-crop, auto format + quality
const PHOTO_TRANSFORM = 'w_400,h_400,c_fill,g_face,f_auto,q_auto';

// Certificate: max 1200px wide, keep aspect ratio, auto format + quality
const CERT_TRANSFORM = 'w_1200,c_limit,f_auto,q_auto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Shared core upload ────────────────────────────────
async function _uploadToCloudinary(file, publicId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', publicId);

    const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Upload failed. Please try again.');
    }
    return res.json();
}

// ── Profile photo ─────────────────────────────────────
async function uploadProfilePhoto(file, userId) {
    if (!ALLOWED_TYPES.includes(file.type))
        throw new Error('Only JPG, PNG, and WEBP images are allowed.');
    if (file.size > 5 * 1024 * 1024)
        throw new Error('Photo too large. Maximum size is 5MB.');

    const data = await _uploadToCloudinary(file, `case/profiles/${userId}`);
    return data.secure_url.replace('/upload/', `/upload/${PHOTO_TRANSFORM}/`);
}

// ── Project preview image ────────────────────────────
async function uploadProjectPreview(file, userId, projectId) {
    if (!ALLOWED_TYPES.includes(file.type))
        throw new Error('Only JPG, PNG, and WEBP images are allowed.');
    if (file.size > 8 * 1024 * 1024)
        throw new Error('Image too large. Maximum size is 8MB.');

    const data = await _uploadToCloudinary(file, `case/projects/${userId}_${projectId}`);
    return data.secure_url.replace('/upload/', '/upload/w_1200,c_limit,f_auto,q_auto/');
}

// ── Certificate image ─────────────────────────────────
async function uploadCertificateImage(file, userId, certId) {
    if (!ALLOWED_TYPES.includes(file.type))
        throw new Error('Certificates must be image files (JPG, PNG, or WEBP). PDFs are not supported — screenshot or export your certificate as an image.');
    if (file.size > 8 * 1024 * 1024)
        throw new Error('Certificate image too large. Maximum size is 8MB.');

    const data = await _uploadToCloudinary(file, `case/certificates/${userId}_${certId}`);
    return data.secure_url.replace('/upload/', `/upload/${CERT_TRANSFORM}/`);
}
