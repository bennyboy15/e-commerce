import {create} from "zustand";
import {toast} from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useUserStore = create((set,get) => ({
  user:null,
  isLoading:false,
  isCheckingAuth:false,

  signup: async ({email, password, confirmPassword, name}) => {
    set({isLoading:true});

    if (!email || !password || !confirmPassword || !name) {
        set({isLoading:false});
        toast.error("Missing required fields");
    }

    if (password !== confirmPassword) {
        set({isLoading:false});
        toast.error("Passwords do not match");
    }

    try {
        const res = await axiosInstance.post("/signup", {name, email, password});
        set({user:res.data, isLoading:false});
    } catch (error) {
        toast.error(error.response.data.message || "Error when signing up");
    }
  },

  login: async ({ email, password }) => {
    set({isLoading: true});

    if (!email || !password) {
        set({isLoading: false});
        toast.error("Missing required fields");
    }

    try {
        const res = await axiosInstance.post("/login", {email,password});
        set({user:res.data, isLoading:false});
    } catch (error) {
        toast.error(error.response.data.message || "Error when logging in");
    }
  },

  logout: async () => {
    set({isLoading:true});
    try {
        await axios.post("/logout");
        set({user:null, isLoading:false});
    } catch (error) {
        set({isLoading:false});
        toast.error("Error when logging out!")
    }
  }

}));
