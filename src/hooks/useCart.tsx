import React, { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {


      const selectedProduct = cart.filter(product => product.id === productId);

      if(selectedProduct.length !== 0){ // esse produto já existe no carrinho? apenas incremento o amount dele
        const amount = selectedProduct[0].amount + 1;
        await updateProductAmount({productId, amount});
      } else{

        const { data } = await api.get(`/products/${productId}`); //adiciono o novo produto no carrinho
        if(!data){
          throw new Error();
        }
        const newProduct = {
          id: data.id,
          title: data.title,
          price: data.price,
          image: data.image,
          amount: 1
        }
        setCart([...cart, newProduct]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]));
      }

    } catch {
      toast.error('Erro na adição do produto');

    }
  };

  const removeProduct = (productId: number) => {
    try {
      let existsProduct = false;
      const removedCart = cart.filter(product => {
        if(product.id !== productId){
          return product;
        } else{
          existsProduct = true;
        }
        return {};
      });
      if(!existsProduct){
        throw new Error();
      }
      
      setCart(removedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`/stock/${productId}`);
      const stockAmount = response.data.amount;
      
      if(amount <= stockAmount && amount >= 1){
        const updatedCart = cart.map(product => {
          if(product.id === productId){
            product.amount = amount;
          }
          return product;
        });
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
      else{
        toast.error('Quantidade solicitada fora de estoque')
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
