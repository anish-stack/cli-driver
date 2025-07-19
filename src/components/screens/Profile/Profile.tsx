import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import Layout from '../../layout/Layout';
import Profile_header from './components/Profile_header';
import { useAuth } from '../../../context/AuthContext';
import Bookings from './components/Bookings';

const Profile: React.FC = ({ navigation }) => {
    const { profileData, fetchUserDetails, logout } = useAuth();
    const [refresh, setRefresh] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchUserDetails();
    }, [refresh]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        setRefresh(prev => !prev); 
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000); 
    }, []);

    return (
        <Layout>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#00aaa9']} 
                        tintColor="#00aaa9"
                    />
                }
            >
                <Profile_header navigation={navigation} onLogout={logout} user={profileData} />
                <Bookings isFetch={refresh} navigation={navigation} />
            </ScrollView>
        </Layout>
    );
};

export default Profile;
