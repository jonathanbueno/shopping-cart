import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
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
  setCart: (cart: Product[]) => void;
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

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      await api.get(`stock/${productId}`);
      const { data } = await api.get(`products/${productId}`);

      if (cart.length > 0) {
        cart.map((product) => {
          if (product.id === productId)
            updateProductAmount({ productId, amount: product.amount });

          return product;
        });
      } else setCart([...cart, { ...data, amount: 1 }]);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      await api.get(`stock/${productId}`);
      const filterProduct = cart.filter((product) => productId !== product.id);

      setCart(filterProduct);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const cartCopy = [...cart];

      cartCopy.map((e, i) => {
        if (e.id === productId)
          cartCopy[i] = {
            ...e,
            amount: amount + 1,
          };

        return e;
      });

      setCart(cartCopy);
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, setCart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
