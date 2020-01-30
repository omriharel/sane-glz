import React from 'react';

import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Loader from './Loader';


export default function Show(props) {
    return props.loading ? <Loader size={10} dark /> : (
    <Container>
        <Row>
            <Col>
                <Container>
                    <Row>
                        <Col>
                            {props.show.name + ' | ' + props.show.quote + ' | ' + props.show.dateStr + ' | ' + props.show.showName + ' | ' + props.show.duration}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <ProgressBar now={0}/>
                        </Col>
                    </Row>
                </Container>
            </Col>
            <Col xs={2} md={1}>
                <Button className="mr-n2" onClick={() => props.playCallback(props.show.url)}>
                    <i className="material-icons md-30">play_circle_outline</i>
                </Button>
            </Col>
        </Row>
    </Container>
    );
}
