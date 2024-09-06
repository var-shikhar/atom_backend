import multer from 'multer';

const fileFilter = (req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'), false);
    }
};
const storage = new multer.memoryStorage();
const isMulterApproved = multer({ storage: storage, fileFilter }).fields([
    {
        name: 'images',
        maxCount: 10
    },
]);

export default isMulterApproved;
