import React from 'react';
import { Card, CardHeader, CardBody, CardFooter } from 'react-simple-card';

interface Props {
    id?: number;
    name?: string;
    title?: string;
    description?: string;
    likes?: number;
    likeProfile: (e: any) => void;
}

const Profile = (props: Props) => (
    <Card>
        <CardHeader>
            <b style={{ marginRight: '70%' }}>{props.name}</b>
            <span
                id={props.id.toString()}
                className="like"
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                onClick={e => props.likeProfile(e.target.id)}
            >
                {' '}
                💜 {props.likes}{' '}
            </span>
        </CardHeader>
        <CardFooter>{props.description}</CardFooter>
        <CardBody>
            <small>{props.title}</small>
        </CardBody>
    </Card>
);

export default Profile;
