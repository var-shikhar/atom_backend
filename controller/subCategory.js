
import CONSTANT from "../constant/constant.js";
import Category from "../modal/category.js";
import SubCategory from "../modal/subCategory.js";

const { RouteCode } = CONSTANT;

const getSubCategoryList = async (req, res) => {
    try {
        const subCategoryList = await SubCategory.find().populate('categoryId').sort({ name: 1 });
        return res.status(RouteCode.SUCCESS.statusCode).json(subCategoryList);
    } catch (err) {
        console.error('Error retrieving SubCategory list:', err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
}
// POST Controller
const postSubCategory = async (req, res) => {
    const { name, description, categoryID } = req.body;
    try {
        let hasName = await SubCategory.findOne({ name: name });
        if (hasName) {
            return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'Sub Category name already exists, Change name!' });
        }

        let hasCategory = await Category.findById(categoryID);
        if (!hasCategory) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: 'Category not found! Try later!' });
        }

        const newSubCategory = new SubCategory({
            name: name,
            description: description,
            categoryId: categoryID,
            isActive: true,
        });

        await newSubCategory.save();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Sub-Category added successfully' });

    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
// Get Init Details
const getInitSubCategory = async (req, res) => {
    const { categoryID } = req.params;
    try {
        // Find the Service
        const subcategory = await SubCategory.findById(categoryID);
        if (!subcategory) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        // Construct category details
        const subCategoryDetail = {
            id: categoryID,
            name: subcategory.name ?? '',
            description: subcategory.description ?? '',
            categoryID: subcategory.categoryId
        };

        // Send response with product details
        return res.status(RouteCode.SUCCESS.statusCode).json(subCategoryDetail);
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};
// Put Controller
const putSubCategory = async (req, res) => {
    const { id, name, description, categoryID } = req.body;
    try {
        let subCat = await SubCategory.findById(id);
        if (!subCat) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: 'Sub Category not found! Try later!' });
        }

        let hasCategory = await Category.findById(categoryID);
        if (!hasCategory) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: 'Category not found! Try later!' });
        }

        if (subCat.name !== name) {
            let hasName = await SubCategory.findOne({ name: name });
            if (hasName) {
                return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'Sub Category name already exists, Change name!' });
            }
        }

        subCat.name = name || subCat.name;
        subCat.description = description || subCat.description;
        subCat.categoryId = categoryID || subCat.categoryId;

        await subCat.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Sub Category has updated successfully' });

    } catch (err) {
        console.error(err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
const putSubCategoryStatus = async (req, res) => {
    const { categoryID, value } = req.body;
    try {
        const subCategory = await SubCategory.findById(categoryID);
        if (!subCategory) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        subCategory.isActive = value;
        await subCategory.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Sub Category Status has updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
// Delete Controller
const deleteSubCategory = async (req, res) => {
    const { categoryID } = req.params;
    try {
        // Find the Service
        const subCategory = await SubCategory.findById(categoryID);
        if (!subCategory) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        await subCategory.deleteOne();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Sub Category has deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};

export default {
    getSubCategoryList, 
    postSubCategory, getInitSubCategory, putSubCategory, putSubCategoryStatus, deleteSubCategory, 
}