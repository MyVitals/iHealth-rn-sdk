import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { ListItem } from '@rneui/themed';


const DeviceTypes = [
  'AM6', 'BG5S', 'BP5S', 'KN550', 'KN550LT',
  'BG1A', 'BG1S', 'HS2S', 'HS2S Pro', 'PO3', 'NT13B'
]

const SelectScreen = ({ navigation }) => {

  return (
    <ScrollView>
      {
        DeviceTypes.map(item => {
          return (
            <ListItem
              key={item}
              onPress={() => {
                navigation.navigate('Scan', { type: item });
              }}
              bottomDivider>
              <ListItem.Content>
                <ListItem.Title>{item}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          )
        })
      }
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start', alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center', alignItems: 'center',
    width: 100, height: 50,
  },
  picker: {
    flex: 1,
    height: 50,
  }
})

export default SelectScreen
