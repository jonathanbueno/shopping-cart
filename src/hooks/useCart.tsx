import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
      const copyCart = [...cart];
      await api.get(`stock/${productId}`);

      const { data } = await api.get(`products/${productId}`);

      const findProductOncart = copyCart.filter(
        (product) => product.id === productId
      );

      if (findProductOncart.length === 0) {
        copyCart.push({ ...data, amount: 1 });
        setCart(copyCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));
        return;
      }

      const [currentProduct] = findProductOncart;

      updateProductAmount({ productId, amount: currentProduct.amount + 1 });
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const copyCart = [...cart];

      const findProductIndex = copyCart.findIndex(
        (product) => productId === product.id
      );

      if (findProductIndex >= 0) {
        copyCart.splice(findProductIndex, 1);
        setCart(copyCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));
      } else throw Error();
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) throw Error();

      const cartCopy = [...cart];

      const isProductNew =
        cartCopy.filter((product) => product.id === productId).length === 0;

      if (isProductNew) throw Error();

      const { data } = await api.get(`stock/${productId}`);

      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      cartCopy.map((product, index) => {
        if (product.id === productId)
          cartCopy[index] = {
            ...product,
            amount,
          };

        return product;
      });

      setCart(cartCopy);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartCopy));
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
