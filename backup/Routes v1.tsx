import { RouteObject } from 'react-router-dom';
import App from './App';
import ServicesCarousel from './ServicesCarousel';
import Terapeutas from './Terapeutas';
// Importe outras páginas conforme necessário

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <ServicesCarousel />, // Ou seu componente principal
      },
      {
        path: 'terapeutas',
        element: <Terapeutas />,
      },
      {
        path: 'services/terapia-online',
        element: <OnlineTherapy />,
      },
      // Adicione mais rotas aqui
    ],
  },
];

export default routes;