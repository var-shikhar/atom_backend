
import CONSTANT from "../constant/constant.js";
import { handleImageDeleting, handleImageUploading } from "../helper/cloudinary.js";
import Product from "../modal/product.js";
import SubCategory from "../modal/subCategory.js";

const { RouteCode } = CONSTANT;

const getProductList = async (req, res) => {
    try {
        const productList = await Product.find().populate('categoryId').sort({ launchDate: -1 });
        return res.status(RouteCode.SUCCESS.statusCode).json(productList);
    } catch (err) {
        console.error('Error retrieving product list:', err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
}
// POST Controller
const postProduct = async (req, res) => {
    const { name, description, categoryID, subCategoryID, mrpPrice, sellingPrice, stock, sku, isVariationProduct, variationType } = req.body;
    const hasVariation = isVariationProduct === 'true' ? true : false;
    try {
        let hasProductName = await Product.findOne({ name: name });
        if (hasProductName) {
            return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'Product name already exists, Change Product name!' });
        }

        if (!req.files || !req.files.images) {
            return res.status(RouteCode.BAD_REQUEST.statusCode).json({ message: 'Images are required!' });
        }

        const uploadedDocURLs = await Promise.all(
            req.files.images.map(async (image) => {
                const imageUrl = await handleImageUploading(image.buffer, image.mimetype);
                return imageUrl; 
            })
        );

        const newProduct = new Product({
            name:  name,
            description: description,
            categoryId: subCategoryID,
            baseMRPPrice: mrpPrice,
            baseSellingPrice: sellingPrice,
            baseSku: sku,
            baseStock: stock,
            isVariationProduct: hasVariation,
            isAvailable: true,
            images: uploadedDocURLs.length > 0 ? uploadedDocURLs : [],
        });

        if (hasVariation && variationType) {
            newProduct.variationName = variationType;
        }

        await newProduct.save();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Product added successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
// Get Init Details
const getInitProduct = async (req, res) => {
    const { productID } = req.params;
    try {
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        const subCategoryList = await SubCategory.find();


        const productDetails = {
            id: productID, 
            name: product.name ?? '', 
            description: product.description ?? '', 
            subCategoryID: product.categoryId ?? '', 
            mrpPrice: product.baseMRPPrice ?? 0, 
            sellingPrice: product.baseSellingPrice ?? 0, 
            stock: product.baseStock ?? 0, 
            sku: product.baseSku ?? '', 
            isVariationProduct: product.isVariationProduct ? true : false,
            variationType: product.isVariationProduct ? product.variationName : '', 
            images: [],
        };

        const subCategory = subCategoryList.find(item => item._id.toString() === product.categoryId.toString());
        productDetails.categoryID = subCategory ? subCategory.categoryId : '';

        return res.status(RouteCode.SUCCESS.statusCode).json(productDetails);
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};
// Put Controller
const putProduct = async (req, res) => {
    const { id, name, description, categoryID, subCategoryID, mrpPrice, sellingPrice, stock, sku, isVariationProduct, variationType } = req.body;
    const hasProductImage = req.files?.images?.length > 0;
    let uploadedDocURLs = [];
    const hasVariation = isVariationProduct === 'true';
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        if (product.name !== name) {
            const hasName = await Product.findOne({ name: name });
            if (hasName) {
                return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'Product name already exists, Try different name!' });
            }
        }

        if (product.baseSku !== sku) {
            const hasSKU = await Product.findOne({ baseSku: sku });
            if (hasSKU) {
                return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'Product SKU already exists, Try different SKU!' });
            }
        }

        if (hasProductImage) {
            uploadedDocURLs = await Promise.all(
                req.files.images.map(async (image) => {
                    const imageUrl = await handleImageUploading(image.buffer, image.mimetype);
                    return imageUrl; 
                })
            );

            await Promise.all(
                product.images?.map(async (image) => {
                    const prevImageURL = image.split('/').pop().split('.')[0];
                    await handleImageDeleting(prevImageURL);
                })
            );
        }

        product.name = name ?? product.name;
        product.description = description ?? product.description;
        product.baseMRPPrice = mrpPrice ?? product.baseMRPPrice;
        product.categoryId = subCategoryID ?? product.categoryId;
        product.baseSellingPrice = sellingPrice ?? product.baseSellingPrice;
        product.baseStock = stock ?? product.baseStock;
        product.baseSku = sku ?? product.baseSku;
        product.images = hasProductImage ? uploadedDocURLs : product.images;        
        product.isVariationProduct = hasVariation ? true : false;
        if(hasVariation){
            product.variationName = variationType ?? product.variationName;
        }

        await product.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Product has updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
const putProductStatus = async (req, res) => {
    const { value, productID } = req.body;
    try {
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        product.isAvailable = typeof value === 'boolean' ? value : false;

        await product.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Product has updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
// Delete Controller
const deleteProduct = async (req, res) => {
    const { productID } = req.params;
    try {
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        // Delete associated product images if they exist
        if (product.images && product.images.length > 0) {
            await Promise.all(product.images.map(async (image) => {
                const prevImageURL = image.split('/').pop().split('.')[0];
                await handleImageDeleting(prevImageURL);
            }));
        }

        // Handle deletion of images in product variations
        if (Array.isArray(product.variations) && product.variations.length > 0) {
            for (const item of product.variations) {
                if (item.images && item.images.length > 0) {
                    await Promise.all(item.images.map(async (image) => {
                        const prevImageURL = image.split('/').pop().split('.')[0];
                        await handleImageDeleting(prevImageURL);
                    }));
                }
            }
        }

        // Delete the product (pre-remove middleware will handle related orders and transactions)
        await product.deleteOne();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Product has deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};

export default {
    getProductList,
    postProduct, getInitProduct, putProduct, putProductStatus, deleteProduct
}
