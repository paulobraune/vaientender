const db = require('../utils/db');
const businessController = require('./businessController');

async function getInvoices(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allInvoices = await db.getAll('invoices');
    const businessInvoices = allInvoices.filter(invoice => invoice.businessId === activeBusiness._id);

    return res.json({
      success: true,
      invoices: businessInvoices
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices: " + error.message
    });
  }
}

async function updatePlan(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const { plan, planCurrency } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plan is required"
      });
    }

    // Check if the plan is valid
    const validPlans = ['none', 'starter', 'pro', 'business', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    // Update only the subscription related fields
    const updateData = {
      plan,
      planCurrency: planCurrency || 'BRL',
      billingPeriod: plan === 'none' ? 'none' : 'monthly',
      billingStatus: plan === 'none' ? 'none' : 'active'
    };

    // For a real implementation, here we would also:
    // 1. Call the payment gateway API to update the subscription
    // 2. Generate a new invoice if needed
    // 3. Update payment method if provided
    // 4. Handle trial periods

    const updatedBusiness = await db.update('businesses', activeBusiness._id, updateData);

    return res.json({
      success: true,
      message: "Subscription updated successfully",
      business: updatedBusiness
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subscription: " + error.message
    });
  }
}

async function cancelSubscription(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    // Update only the subscription related fields
    const updateData = {
      plan: 'none',
      billingPeriod: 'none',
      billingStatus: 'cancelled'
    };

    // For a real implementation, here we would also:
    // 1. Call the payment gateway API to cancel the subscription
    // 2. Handle any proration or refunds if necessary
    // 3. Update internal records of the cancellation

    const updatedBusiness = await db.update('businesses', activeBusiness._id, updateData);

    return res.json({
      success: true,
      message: "Subscription cancelled successfully",
      business: updatedBusiness
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Error cancelling subscription: " + error.message
    });
  }
}

module.exports = {
  getInvoices,
  updatePlan,
  cancelSubscription
};