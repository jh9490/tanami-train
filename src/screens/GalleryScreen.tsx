import React, { useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import styled from 'styled-components/native';
import ImageViewer from 'react-native-image-zoom-viewer';

const screenWidth = Dimensions.get('window').width;

const Container = styled.View`
  flex: 1;
  background-color: #fff8e5;
  padding: 10px;
`;

const ImageItem = styled(Image)`
  width: ${(screenWidth - 40) / 3}px;
  height: 110px;
  margin: 5px;
  border-radius: 10px;
`;

const remoteImages = [
  { url: 'http://tanamitrain.com/tanamiAdmin/common/media/gallery/galleryaADY8EZS5u.jpg' },
  { url: 'http://tanamitrain.com/tanamiAdmin/common/media/gallery/gallerylIl0Qw0YO5.jpg' },
  { url: 'http://tanamitrain.com/tanamiAdmin/common/media/gallery/galleryGXKxda2zAo.jpg' },
  { url: 'http://tanamitrain.com/tanamiAdmin/common/media/gallery/galleryfBCerpaMBL.jpg' },
];

const GalleryScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openImage = (index: number) => {
    setCurrentIndex(index);
    setIsVisible(true);
  };

  return (
    <Container>
      <FlatList
        data={remoteImages}
        keyExtractor={(_, index) => index.toString()}
        numColumns={3}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => openImage(index)}>
            <ImageItem source={{ uri: item.url }} />
          </TouchableOpacity>
        )}
      />

      <Modal visible={isVisible} transparent={true} onRequestClose={() => setIsVisible(false)}>
        <ImageViewer
          imageUrls={remoteImages}
          index={currentIndex}
          onCancel={() => setIsVisible(false)}
          enableSwipeDown
          backgroundColor="#000"
          loadingRender={() => (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          )}
        />
      </Modal>
    </Container>
  );
};

export default GalleryScreen;
