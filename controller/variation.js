import CONSTANT from "../constant/constant.js";
import { handleImageDeleting, handleImageUploading } from "../helper/cloudinary.js";
import Product from "../modal/product.js";

const { RouteCode } = CONSTANT;

// POST Controller
const postVariation = async (req, res) => { 
    const { productID, variationType, mrpPrice, sellingPrice, stock, sku } = req.body;
    let uploadedGalleryURLs = []

    try {
        let product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: 'Product not found! Try again!' });
        }

        const hasSKUInProduct = await Product.findOne({
            $or: [
                { baseSku: sku }, // Check if SKU exists in any product's baseSku
                { 'variations.sku': sku } // Check if SKU exists in any product's variations
            ],
        });

        if (hasSKUInProduct) {
            return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'SKU already exists, Try different SKU!' });
        }


        if (req.files?.images?.length > 0) {
            uploadedGalleryURLs = await Promise.all(
                req.files.images.map(async (image) => {
                    const imageUrl = await handleImageUploading(image.buffer, image.mimetype);
                    return imageUrl; 
                })
            );
        }

        const newVariation = {
            value: variationType,
            mrpPrice: mrpPrice ?? 0,
            sellingPrice: sellingPrice ?? 0,
            stock: stock ?? 0,
            sku: sku || '',
            images: uploadedGalleryURLs,
            isAvailable: true,
        };

        product.variations.push(newVariation)

        await product.save();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Variation has added successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
// Get Init Details
const getInitVariation = async (req, res) => {
    const { productID, variationID } = req.params;
    try {
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        const variationProduct = product.variations.find(item => item._id?.toString() === variationID?.toString());
        if(!variationProduct){
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        const productDetails = {
            id: variationID,
            productID: productID, 
            variationType: variationProduct.value ?? '', 
            mrpPrice: variationProduct.mrpPrice ?? 0,
            sellingPrice: variationProduct.sellingPrice ?? 0,
            stock: variationProduct.stock ?? 0, 
            sku: variationProduct.sku ?? '',
        };

        return res.status(RouteCode.SUCCESS.statusCode).json(productDetails);
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};
// Put Controller
const putVariation = async (req, res) => {
    const { id, productID, variationType, mrpPrice, sellingPrice, stock, sku } = req.body;
    const hasProductImage = req.files?.images?.length > 0;
    let uploadedDocURLs = [];
    
    try {
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        const variationProduct = product.variations.find(item => item._id.toString() === id.toString());
        if (!variationProduct) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        // Check for SKU uniqueness across all products (including base and variation SKUs)
        const hasSKUInProduct = await Product.findOne({
            $or: [
                { baseSku: sku }, // Check if SKU exists in any product's baseSku
                { 'variations.sku': sku } // Check if SKU exists in any product's variations
            ],
            _id: { $ne: productID } // Exclude the current product from the check
        });

        if (hasSKUInProduct) {
            return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'SKU already exists, Try different SKU!' });
        }

        if (hasProductImage) {
            uploadedDocURLs = await Promise.all(
                req.files.images.map(async (image) => {
                    const imageUrl = await handleImageUploading(image.buffer, image.mimetype);
                    return imageUrl; 
                })
            );

            if (variationProduct.images?.length > 0) {
                await Promise.all(
                    variationProduct.images.map(async (image) => {
                        const prevImageURL = image.split('/').pop().split('.')[0];
                        await handleImageDeleting(prevImageURL);
                    })
                );
            }
        }

        // Update variation details
        variationProduct.value = variationType ?? variationProduct.value;
        variationProduct.images = uploadedDocURLs.length > 0 ? uploadedDocURLs : variationProduct.images;
        variationProduct.mrpPrice = mrpPrice ?? variationProduct.mrpPrice;
        variationProduct.sellingPrice = sellingPrice ?? variationProduct.sellingPrice;
        variationProduct.stock = stock ?? variationProduct.stock;
        variationProduct.sku = sku ?? variationProduct.sku;



        product.variations = product.variations.map(item => item._id.toString() === id.toString() ? variationProduct : item);
      
        // Save the updated product
        await product.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Variation has updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
}
const putVariationStatus = async (req, res) => {
    const { value, productID, variationID } = req.body;
    try {
        if (typeof value !== 'boolean') {
            return res.status(RouteCode.BAD_REQUEST.statusCode).json({ message: 'Invalid value type' });
        }

        const product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }
        
        const variationIndex = product.variations.findIndex(item => item._id.toString() === variationID.toString());
        if (variationIndex === -1) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        product.variations[variationIndex].isAvailable = value;

        await product.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Variation status updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
}
// Delete Controller
const deleteVariation = async (req, res) => {
    const { productID, variationID } = req.params;
    try {
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }
        
        const variationIndex = product.variations.findIndex(item => item._id?.toString() === variationID?.toString());
        if (variationIndex === -1) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        const variationProduct = product.variations[variationIndex];
        if (variationProduct.images && variationProduct.images.length > 0) {
            await Promise.all(variationProduct.images.map(async (image) => {
                const prevImageURL = image.split('/').pop().split('.')[0];
                await handleImageDeleting(prevImageURL);
            }));
        }

        product.variations.splice(variationIndex, 1);
        await product.save();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Variation has been deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};


export default {
    postVariation, getInitVariation, putVariation, putVariationStatus, deleteVariation
}
