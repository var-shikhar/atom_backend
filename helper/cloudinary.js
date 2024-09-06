import cloudinary from 'cloudinary';

export async function handleImageDeleting(publicURL){
    await cloudinary.v2.uploader.destroy(publicURL, function(error, result) {
        if (error) {
            console.error('Error deleting from Cloudinary:', error);
            throw new Error('Failed to delete document from Cloudinary');
        }
        console.log(result)
        return result;
    });
}

export async function handleImageUploading(imageBuffer, mimetype){
    const b64 = Buffer.from(imageBuffer).toString("base64");
    let dataURI = "data:" + mimetype + ";base64," + b64;
    
    const response = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
    });

    const docURL = response.secure_url;
    return docURL
}

