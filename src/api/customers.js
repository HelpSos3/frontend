import api from "./client";

//ดึงรายชื่อลูกค้า
export const fetchCustomers = async ({q = "", page = 1, per_page = 20 }) => {
    const params = {};

    if (q) params.q = q;
    params.page = page;
    params.per_page = per_page;
    
    const res = await api.get("/customers/", { params }); 
    return res.data
};

// ดึงรายละเอียดเพิ่มเติม
export const fetchCustomerDetail = async (customerId, page = 1, per_page = 20) => {
    const params = {page, per_page};
    const res = await api.get(`/customers/${customerId}`, {params});
    return res.data;
};