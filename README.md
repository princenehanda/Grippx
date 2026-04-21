# Grippx Website & E-Commerce

Source code for the Grippx official website, including the product shop, digital catalogues, and Paystack checkout integration.

## Product Synchronization

The shop is integrated with the National Flag API to manage inventory and pricing automatically.

### Running the Sync

To update the products, run this command in your terminal:

```bash
node js/sync-nationalflag.js
```

### Technical Details

- **Price Markup**: A 30% markup is applied to all supplier prices during synchronization.
- **Dynamic Filters**: Shop categories are updated automatically based on the latest inventory.
- **Lazy Loading**: The product grid uses pagination to maintain performance with large datasets.

## Deployment

Ensure `data/products.json` is updated and uploaded to the server whenever you run the sync script.
