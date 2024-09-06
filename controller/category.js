
import CONSTANT from "../constant/constant.js";
import Category from "../modal/category.js";

const { RouteCode } = CONSTANT;

const getCategoryList = async (req, res) => {
    try {
        const categoryList = await Category.find().sort({ name: 1 });

        return res.status(RouteCode.SUCCESS.statusCode).json(categoryList);
    } catch (err) {
        console.error('Error retrieving Category list:', err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
}
// POST Controller
const postCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        let hasName = await Category.findOne({ name: name });
        if (hasName) {
            return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'Category name already exists, Change Category name!' });
        }

        const newCategory = new Category({
            name: name,
            description: description,
            isActive: true,
        });

        await newCategory.save();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Category added successfully' });

    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
// Get Init Details
const getInitCategory = async (req, res) => {
    const { categoryID } = req.params;
    try {
        // Find the Service
        const category = await Category.findById(categoryID);
        if (!category) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        // Construct category details
        const categoryDetail = {
            id: categoryID,
            name: category.name ?? '',
            description: category.description ?? '',
        };

        // Send response with product details
        return res.status(RouteCode.SUCCESS.statusCode).json(categoryDetail);
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};
// Put Controller
const putCategory = async (req, res) => {
    const { id, name, description } = req.body;
    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        if (category.name !== name) {
            const hasName = await Category.findOne({ name: name });
            if (hasName) {
                return res.status(RouteCode.CONFLICT.statusCode).json({ message: 'Category name already exists, Try different name!' });
            }
        }

        category.name = name || category.name;
        category.description = description || category.description;
       
        await category.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Category has updated successfully' });

    } catch (err) {
        console.error(err);
        return res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
const putCategoryStatus = async (req, res) => {
    const { categoryID, value } = req.body;
    try {
        const category = await Category.findById(categoryID);
        if (!category) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        category.isActive = value;
        await category.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Category Status has updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message })
    }
}
// Delete Controller
const deleteCategory = async (req, res) => {
    const { categoryID } = req.params;
    try {
        // Find the Service
        const category = await Category.findById(categoryID);
        if (!category) {
            return res.status(RouteCode.NOT_FOUND.statusCode).json({ message: RouteCode.NOT_FOUND.message });
        }

        await category.deleteOne();

        res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Category has deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(RouteCode.SERVER_ERROR.statusCode).json({ message: RouteCode.SERVER_ERROR.message });
    }
};

export default {
    getCategoryList, 
    postCategory, getInitCategory, putCategory, putCategoryStatus, deleteCategory
}