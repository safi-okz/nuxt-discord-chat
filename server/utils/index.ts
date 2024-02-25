import { Server, type ServerOptions, type Socket } from 'socket.io';
import moment from 'moment';
import type { H3Event } from 'h3';
import type { User } from '../types';
import { getCurrentUser, getRoomUsers, userJoin, userLeave, users } from './users';

const options: Partial<ServerOptions> = {
    path: '/api/socket.io',
    serveClient: false
}

export const io = new Server(options);

const botName = 'NuxtChatapp Admin';
export function initSocket(event: H3Event) {
    // @ts-ignore
    io.attach(event.node.res.socket.server);

    io.on('connection', (socket: Socket) => {
        console.log('socket connected ', socket.id);

        // Join room connection
        socket.on('joinRom', (payload: User) => {
            const user = userJoin({...payload, id: socket.id});
            socket.join(user.room);

            socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has join the chat`));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        })

        // Handle chat 
        socket.on('chatMessage', (payload: string) => {
            const user = getCurrentUser(socket.id);
            if(user) {
                io.to(user.room).emit('message', formatMessage(user.username, payload));
            }
        })

        // Disconnection 
        socket.on('disconnect', () => {
            const user = userLeave(socket.id);
            if(user) {

               io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
    
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                })
            }
        })
    })
}

export function formatMessage(username: string, text: string) {
    return {
            username,
            text,
            time: moment().format('h:mm a')
    }
}