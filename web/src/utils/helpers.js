// Format currency in Indian Rupees
export const formatRent = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// Relative time (e.g., "2 days ago")
export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN');
};

// Truncate text
export const truncate = (str, len = 80) =>
  str?.length > len ? str.slice(0, len) + '…' : str;

// Get primary photo URL from a listing
export const getPrimaryPhoto = (listing) =>
  listing?.photos?.find((p) => p.isPrimary)?.url ||
  listing?.photos?.[0]?.url ||
  null;

// Build amenity list from amenity object
export const getAmenityList = (amenities) => {
  if (!amenities) return [];
  const map = {
    wifi: 'WiFi', ac: 'AC', parking: 'Parking', fridge: 'Fridge',
    washingMachine: 'Washing Machine', kitchen: 'Kitchen', lift: 'Lift',
    gym: 'Gym', security: 'Security', powerBackup: 'Power Backup',
    waterSupply: 'Water Supply', cctv: 'CCTV',
  };
  return Object.entries(map).filter(([key]) => amenities[key]).map(([, label]) => label);
};

// Listing type label
export const listingTypeLabel = (type) =>
  ({ HOUSE_RENTAL: 'House Rental', ROOM_SHARING: 'Room Sharing', HOSTEL: 'Hostel / PG', LAND_SALE: 'Land Sale' })[type] || type;

// Request status color class
export const requestStatusClass = (status) => ({
  PENDING:  'badge-warning',
  ACCEPTED: 'badge-success',
  REJECTED: 'badge-danger',
}[status] || 'badge-gray');

// Extract error message from axios error
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';
