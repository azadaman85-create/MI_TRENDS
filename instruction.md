# 🔴 CRITICAL: Diagnose Why Products Are Not Publishing to the Frontend

I need you to investigate my e-commerce application's product publishing system **end-to-end**.

Do NOT immediately change or rewrite the code.

First, perform a complete technical audit to determine **exactly where the product data is being stored, where product images are being stored, what happens when I click Publish, and why the published product is not appearing on the customer-facing frontend.**

The most important requirement is:

> **Find the actual source of truth for my products and images. Determine whether the data is permanently stored in the database/storage or only exists temporarily in frontend/backend state.**

---

# 1. Trace the Complete Product Lifecycle

Trace one product through the entire system:

```text
Admin Product Form
        ↓
Form State
        ↓
Save/Create API
        ↓
Backend Validation
        ↓
Database
        ↓
Image/File Storage
        ↓
Product Record
        ↓
Publish API
        ↓
Published Status
        ↓
Storefront Product API
        ↓
Frontend State
        ↓
Product Listing
        ↓
Product Detail Page
```

Do not skip any layer.

Identify the exact file, function, API endpoint, database table/collection, storage bucket/path, and frontend component involved at each step.

---

# 2. Find EXACTLY Where Product Details Are Stored

When I create a product from the admin dashboard, determine exactly where each field is stored.

Check all product fields including:

* Product ID
* Product name
* Description
* Short description
* Price
* Sale price
* Discount
* Category
* Subcategory
* Brand
* SKU
* Stock
* Inventory
* Variants
* Options
* Attributes
* Specifications
* Tags
* SEO title
* SEO description
* Slug
* Visibility
* Status
* Published state
* Active state
* Created date
* Updated date

For every field, identify:

```text
Frontend field
↓
Request payload field
↓
Backend field
↓
Database column/document field
↓
Actual stored value
```

Do not assume the field names.

Inspect the actual code and actual database schema.

---

# 3. Find EXACTLY Where Product Images Are Stored

This is extremely important.

When I upload a product image from the admin dashboard, determine:

### Where does the image physically go?

Check whether the application uses:

* Supabase Storage
* Firebase Storage
* AWS S3
* Cloudinary
* Local filesystem
* Database blob
* Another object-storage provider
* Temporary browser storage
* Base64
* Blob/Object URL
* Some custom upload API

Identify the exact:

* Storage provider
* Bucket name
* Folder/path
* File name
* Asset ID
* Public URL
* Database image record
* Product-to-image relationship

Trace:

```text
Select Image
↓
Upload Function
↓
Upload API
↓
Storage Provider
↓
Storage Bucket
↓
Stored File
↓
Returned URL/Asset ID
↓
Database Image Record
↓
Product ID Relationship
↓
Product API
↓
Frontend Image
```

I need you to verify that the image is **actually permanently stored**.

Do not assume that an image preview means the image was successfully uploaded.

---

# 4. Check for Temporary Image Storage

Specifically search the code for:

```text
URL.createObjectURL()
blob:
FileReader
base64
localStorage
sessionStorage
temporary upload
preview URL
imagePreview
previewImages
blob URL
```

Determine whether these are being used only for preview purposes or whether the application incorrectly relies on them as the permanent product image.

If the product image exists only as a temporary browser URL, identify that as a root cause.

---

# 5. Inspect the Product Creation API

Find the exact API used when I click:

**Save Product / Create Product / Add Product**

Document:

```text
HTTP Method:
Endpoint:
Frontend file:
Backend file:
Request payload:
Validation:
Database operation:
Database table/collection:
Response:
```

Verify whether ALL product information is actually sent.

Check for fields being:

* Dropped
* Renamed incorrectly
* Set to `undefined`
* Set to `null`
* Removed during validation
* Removed during serialization
* Ignored by the backend
* Stored in the wrong database field

---

# 6. Verify the Actual Database Record

Do not rely on the admin UI.

After creating a test product, inspect the **actual database record**.

Show the actual structure/value of the record in a safe way.

Determine:

```text
Product ID:
Status:
Published:
Active:
Visibility:
Image reference:
Price:
Category:
Stock:
Created:
Updated:
```

Use the application's actual field names.

Do not assume the database uses:

```text
status
isPublished
isActive
```

Find the real fields.

---

# 7. Investigate the Publish Button

Find the exact code executed when I click:

**Publish**

Trace:

```text
Publish Button
↓
Frontend Handler
↓
API Request
↓
Backend Endpoint
↓
Database Update
↓
Response
↓
Frontend State
```

Determine exactly what is happening.

Check whether Publish:

* Does nothing
* Only changes local React/Vue state
* Calls the wrong API
* Sends the wrong product ID
* Sends the wrong status
* Updates the wrong database field
* Updates the wrong database record
* Fails validation
* Fails authentication
* Fails authorization
* Updates the database but returns an incorrect response
* Shows a fake success message
* Updates admin state but not the database

---

# 8. Compare BEFORE and AFTER Publish

Create one real test product.

Before Publish, inspect the database.

Then click Publish.

Immediately inspect the same product again.

Document:

### BEFORE

```text
Product ID:
Status:
Published:
Active:
Visibility:
Image:
```

### AFTER

```text
Product ID:
Status:
Published:
Active:
Visibility:
Image:
```

If nothing changes in the database after clicking Publish, identify the exact reason.

---

# 9. Check the Storefront Product API

Find the API/query that the customer-facing storefront uses.

Identify:

```text
Endpoint:
HTTP Method:
Backend file:
Database query:
Filters:
Authentication:
Response:
```

Check whether it filters products using something like:

```text
status = published
isPublished = true
isActive = true
visibility = public
stock > 0
```

or any equivalent condition.

Compare the storefront query with the actual database record.

For example:

```text
Database:
status = "active"

Frontend API:
status = "published"
```

If this mismatch exists, identify it as a root cause.

---

# 10. Check Whether Admin and Frontend Use Different Databases

This is a HIGH PRIORITY check.

Verify that the admin dashboard and customer storefront are using the same:

* API
* API base URL
* Database
* Supabase project
* Firebase project
* PostgreSQL instance
* MongoDB database
* Environment variables
* Production/staging environment

Specifically check:

```text
Admin API URL
Storefront API URL

Admin database
Storefront database

Admin environment
Storefront environment
```

A critical possible failure is:

```text
ADMIN
↓
Database A

STOREFRONT
↓
Database B
```

If this is happening, identify it clearly.

---

# 11. Check Image Retrieval

Once the product API returns a product, verify whether the image information is included.

Trace:

```text
Database Image
↓
Backend Product Query
↓
API Response
↓
Frontend Product Object
↓
Image Component
↓
Image URL
↓
Browser
```

Determine:

* Is the image URL present?
* Is the URL correct?
* Is it public?
* Does it expire?
* Does it require authentication?
* Is the storage bucket private?
* Is the frontend using the correct image field?
* Is there a URL transformation issue?
* Is CORS blocking the image?
* Is the frontend constructing an incorrect relative URL?

---

# 12. Check Frontend Rendering

Only after verifying the API response, inspect the frontend.

If the storefront API returns:

```text
0 products
```

continue backward and find why.

If the storefront API returns products but the UI shows nothing, investigate:

* State management
* API response parsing
* Product mapping
* Filters
* Empty-state logic
* Pagination
* Product cards
* Category filtering
* Search filtering
* Loading state
* Error state
* Product routes

Do not simply remove filters without understanding why they exist.

---

# 13. Check Caching

Investigate whether the storefront is showing stale data because of:

* Browser cache
* Next.js cache
* ISR
* SSR cache
* React Query
* SWR
* API caching
* CDN
* Server-side caching
* Database query caching

Test the product API using a fresh request.

Determine whether a newly published product is immediately available from the backend API.

---

# 14. Check Permissions / RLS

If the application uses Supabase, Firebase, PostgreSQL RLS, or another permission system, inspect the relevant policies.

Verify:

```text
Admin:
Can create/update/publish products

Customer:
Can read published products

Customer:
Cannot modify products
```

Check whether anonymous/public users are allowed to read published products.

Also check image/storage permissions.

---

# 15. Search for Hardcoded or Mock Product Data

Search the entire project for:

```text
mockProducts
sampleProducts
dummyProducts
products = [...]
staticProducts
demoProducts
fakeProducts
```

Determine whether the storefront is accidentally reading from static/mock data instead of the real database.

The storefront must use the actual product API/database.

---

# 16. Search for Multiple Product Models or APIs

Search the project for:

```text
products
product
productService
productApi
productRepository
productStore
productController
productModel
```

Determine whether there are multiple competing product systems.

For example:

```text
Admin uses ProductService A

Storefront uses ProductService B
```

or:

```text
Admin writes to /api/admin/products

Storefront reads from /api/store/products
```

Verify that both ultimately use the same persistent source of truth.

---

# 17. Do NOT Fix Anything Yet

First provide a diagnostic report.

I want you to tell me:

### ROOT CAUSE

Exactly why products created in the backend are not appearing on the frontend.

### PRODUCT DATA STORAGE

Where product information is currently stored.

### IMAGE STORAGE

Where uploaded images are currently stored.

### DATABASE

Which database/table/collection stores the product.

### IMAGE STORAGE

Which bucket/folder/provider stores the images.

### PUBLISH FLOW

What actually happens when Publish is clicked.

### STOREFRONT API

Which API retrieves products.

### FRONTEND

Why the frontend currently shows zero products.

### ENVIRONMENT

Whether admin and storefront use the same environment/database.

---

# 18. Show Me the Actual Data Flow

After investigation, provide a diagram similar to:

```text
ADMIN DASHBOARD
      ↓
Product Form
      ↓
Create Product API
      ↓
Database
      ↓
Product ID
      ↓
Image Upload
      ↓
Storage Bucket
      ↓
Image URL / Asset ID
      ↓
Product Image Record
      ↓
Publish API
      ↓
Database Status Update
      ↓
Storefront Product API
      ↓
Published Product Query
      ↓
Frontend
      ↓
Product Card
      ↓
Product Detail Page
```

Mark exactly where the current flow breaks.

---

# 19. Test With One Real Product

Use a completely new test product.

Example:

```text
Product Name: Publishing Test Product
Price: 999
Stock: 10
Category: Test Category
Image: newly uploaded test image
```

Then test:

```text
Create
↓
Save
↓
Database verification
↓
Image storage verification
↓
Publish
↓
Database verification
↓
Storefront API
↓
Frontend
```

Do not declare success just because the admin dashboard displays:

**"Product published successfully."**

The success condition is:

```text
Database = Published
+
Image = Permanently Stored
+
Storefront API = Product Returned
+
Frontend = Product Visible
```

---

# 20. Important Rule

Do NOT:

* Hardcode products
* Add mock products
* Force draft products onto the frontend
* Remove publication filters blindly
* Fake API responses
* Fake successful publishing
* Bypass authentication
* Disable security/RLS
* Store product information only in frontend state
* Store images only as temporary preview URLs
* Create a second unnecessary database
* Hide the actual error

The objective is to find the **real architectural/root-cause problem**.

---

# FINAL OUTPUT REQUIRED

After completing the investigation, provide a concise report with:

1. **Exact root cause**
2. **Where product data is currently stored**
3. **Where product images are currently stored**
4. **Database table/collection**
5. **Storage bucket/path/provider**
6. **Product creation API**
7. **Publish API**
8. **Storefront product API**
9. **Exact point where the data flow breaks**
10. **Why the frontend currently shows no products**
11. **Admin vs storefront environment comparison**
12. **Relevant files/components**
13. **Recommended fix**
14. **Any database/schema changes required**
15. **Any image-storage changes required**
16. **End-to-end test result**

Do not stop at the first error.

Trace the product from:

**Admin → Database → Image Storage → Publish → Storefront API → Frontend**

and identify the exact reason why the product is not appearing on the frontend.