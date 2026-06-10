const coupons = [
  {
    code: 'FWDEORS15',
    type: 'Percentage',
    discountValue: 15,
    minOrderAmount: 300,
    maxDiscountAmount: 150,
    expiryDate: '2027-12-31',
    isActive: true,
  },
  {
    code: 'SAMIRA10',
    type: 'Percentage',
    discountValue: 10,
    minOrderAmount: 799,
    maxDiscountAmount: 600,
    expiryDate: '2027-12-31',
    isActive: true,
  },
  {
    code: 'SALE250',
    type: 'Flat',
    discountValue: 250,
    minOrderAmount: 999,
    maxDiscountAmount: 250,
    expiryDate: '2027-12-31',
    isActive: true,
  },
];

export default coupons;
