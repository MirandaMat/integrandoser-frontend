// src/components/SocketProvider.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io, { Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // CORREÇÃO: Lemos o token aqui para usá-lo como dependência do useEffect
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Se não houver token, garantimos que não haja socket conectado.
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      console.log("SocketProvider: Token não encontrado, conexão não estabelecida.");
      return;
    }

    // Conecta ao servidor com o token de autenticação
    const newSocket = io(API_URL, {
      auth: { token }
    });

    setSocket(newSocket);
    console.log("SocketProvider: Conexão estabelecida/atualizada e fornecida ao contexto.");

    // Função de limpeza para desconectar quando o token mudar ou o componente desmontar
    return () => {
      newSocket.disconnect();
      console.log("SocketProvider: Conexão encerrada.");
    };
    // CORREÇÃO: Adicionamos o 'token' como dependência.
    // O useEffect será executado novamente sempre que o valor do token mudar.
  }, [token]); 

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};